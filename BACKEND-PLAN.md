# Backend plan — Maison & Co.

**Status:** design, not yet implemented. The frontend is fully built and runs on
mock data ([lib/data.ts](lib/data.ts)). This doc is the blueprint for swapping
that for a real backend without rebuilding any UI.

> Read [PROJECT.md](PROJECT.md) first for the route inventory and what's mocked
> where. This doc layers the data, security, and API design on top.

---

## At a glance

- **Backend = Supabase + thin Next.js Route Handlers.** Both web and the future
  Expo mobile app talk to Supabase via the official SDK. Route handlers exist
  only for things that need server secrets (Lemon Squeezy webhooks, send email).
- **Domain shape (locked):** `services` (catalog) → `sessions` (calendar slot,
  capacity ≥ 1) → `bookings` (one client's enrollment in a session). Solo
  bookings = capacity-1 session with 1 booking; group classes = capacity-N
  session with up to N bookings. One model handles both.
- **Multi-tenant by `studio_id`.** Every row scopes by studio. RLS enforces
  isolation so two studios using the same database cannot read each other.
- **Payments:** Lemon Squeezy for the SaaS subscription that owners pay Maison
  & Co. Client-to-studio payments (credit packs, plans) are out-of-platform
  for v1 and tracked manually; LS-via-owner-account or Stripe Connect can come
  later.
- **No realtime in v1** except chat. Bookings refresh on focus + on mutation.
  Move to Supabase Realtime when load justifies it.

---

## 1. Stack (locked decisions)

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Next.js 16 (already here) Route Handlers + Server Actions | Same project. No separate API server. |
| **Database** | **Supabase Postgres** | Bundles auth + storage + realtime + RLS. Postgres is right for a relational booking app. |
| **Auth** | **Supabase Auth** | Going all-in on Supabase keeps the surface minimal. (Clerk is the alternative; pick if you want better invite UX out of the box. Either works — schema doesn't change.) |
| **Payments — SaaS** | **Lemon Squeezy** | Already chosen. MoR — handles VAT/tax. Pakistan-friendly. |
| **Payments — client→studio** | **Manual ledger v1**; pluggable LS-as-owner or Stripe Connect later | Avoids regulatory/marketplace pain. Studios collect however they want; we track. |
| **Email** | **Resend** | Cheap, devex-friendly, React Email templates. |
| **File uploads** | **Supabase Storage** | Avatars, logos. RLS-scoped buckets. |
| **Hosting** | **Vercel** | First-party Next.js. Repo already has `.agents/skills/vercel:*` setup. |
| **Realtime (chat)** | **Supabase Realtime** | Free up to scale. |
| **Cron jobs** | **Vercel Cron** + Postgres functions | Monthly credit grants, recurring class generation, payout calculations, reminders. |

**Why not Clerk?** Lower complexity. Supabase Auth handles email/password,
magic links, social login. Invite UX isn't as polished but is workable. If you
hit a wall on multi-org/invitation flow, swap to Clerk later — only `users.id`
references would migrate.

**Why not roll our own auth?** You'd reinvent password reset, OAuth, rate
limits, MFA. Skip.

---

## 2. Section-by-section audit

What each screen needs from the backend. Use this table as the test for
"is the schema enough?" — every cell below must be answerable by a query.

### Auth pages (`(auth)/...`)

| Screen | Reads | Writes |
|---|---|---|
| `/login` | – | sign-in via Supabase Auth |
| `/signup` | – | create `auth.users` → trigger inserts `users`, `studios`, `studio_members(role=owner)` |
| `/forgot-password` | – | send reset email via Supabase |

### Owner

| Screen | Reads | Writes |
|---|---|---|
| `/owner` (dashboard) | studio MRR (sum `payments`), today's `sessions` w/ `bookings`, 12-mo revenue series (aggregated), `studio_members` w/ admin perf (clients, util, MTD earned), `studio_subscriptions` health | – |
| `/owner/calendar` | all `sessions` for studio, joined `bookings` | – (calendar is view-only at owner level v1) |
| `/owner/clients` | `studio_members where role=client` w/ plan, credits, last visit, LTV (sum payments) | – |
| `/owner/admins` | `studio_members where role=admin` w/ schedule density, commission, MTD earnings, pending invites | invite admin (insert `studio_members(status=invited)` + email) |
| `/owner/offers` | `subscription_plans`, `credit_packs` for this studio | CRUD on both |
| `/owner/finance` | aggregated `payments` (incoming), `payouts` (outgoing), recent `transactions` | trigger payout |
| `/owner/settings` | `users`, `studios`, `studio_subscriptions` | profile, studio, LS portal redirect |

### Admin (formerly stylist)

| Screen | Reads | Writes |
|---|---|---|
| `/admin` (overview) | today's `sessions where admin_id=me` w/ `bookings`, weekly earnings (last 8w from `bookings ⋈ services`), recent `threads`, my `services` | services CRUD via embedded `ServicesPanel` |
| `/admin/calendar` | `sessions where admin_id=me` w/ `bookings` | new class (insert `sessions`), reschedule/cancel |
| `/admin/bookings` | `bookings ⋈ sessions where admin_id=me`, tabbed by status | confirm/decline pending |
| `/admin/clients` | distinct `client_id` from my bookings + their stats (visits with me, LTV with me) | – |
| `/admin/messages` | `threads where I'm a participant`, `messages` for active thread | send `message`, mark read |
| `/admin/earnings` | per-booking `statement` view (gross + commission), 8w bars, service mix | – |
| `/admin/settings` | `users`, `studio_members`, `availability_rules`, `availability_exceptions`, `studio_members.require_booking_approval`, buffer | profile, working hours, time off, booking rules |

### Client

| Screen | Reads | Writes |
|---|---|---|
| `/client` (home) | `studio_members(me)` w/ plan + credit balance, my upcoming `bookings`, my recent `bookings`, "book again" derived from history | – |
| `/client/book` 1-on-1 | `services where mode=solo and active`, derived free slots (admin availability − existing sessions) | new `session` + `booking` in transaction |
| `/client/book` Classes | `sessions where mode=group and starts_at>now and bookings_count<capacity` | new `booking` |
| `/client/bookings` | my `bookings`, tabbed | cancel |
| `/client/credits` | `studio_members(me).credit_balance`, available `subscription_plans`, `credit_packs`, `credit_transactions` ledger | switch plan (LS checkout), top-up (LS checkout) |
| `/client/messages` | same as admin messages | same |
| `/client/settings` | `users` | profile |

---

## 3. Data model

Full schema. Field types are Postgres-flavored. Indexes are noted where
non-obvious. **Every domain table has `studio_id` for tenant scoping** unless
stated.

### A. Identity & tenancy (3 tables)

#### `studios`
The tenant. Every other row scopes by `studio_id`.
```
id                  uuid PK default uuid_generate_v4()
name                text not null
slug                text not null unique
owner_id            uuid not null FK → users.id
country             text                          -- ISO; affects payment options
timezone            text not null default 'UTC'   -- IANA
locale              text not null default 'en-US'
currency            text not null default 'EUR'
logo_url            text
created_at          timestamptz not null default now()
```

#### `users`
**One users row per human.** Same person can be a member of multiple studios in
different roles (e.g., a client who's also a stylist at another studio).
```
id                  uuid PK   -- matches auth.users.id
email               citext not null unique
name                text not null
avatar_hue          int not null default 195      -- the OKLCH hue used in UI
avatar_url          text
phone               text
locale              text
created_at          timestamptz not null default now()
```

#### `studio_members`
Junction. **The most important table.** Holds per-(studio, user) state — one
person can have multiple roles across studios.
```
id                       uuid PK
studio_id                uuid not null FK → studios.id
user_id                  uuid not null FK → users.id
role                     text not null check (role in ('owner','admin','client'))
status                   text not null default 'active'
                         check (status in ('active','invited','suspended'))
invited_by               uuid FK → users.id

-- admin-only:
specialty                text                 -- "Senior Colorist"
commission_pct           numeric(5,2)         -- 0..100, % admin keeps
monthly_fee_cents        int                  -- chair rental, optional
require_booking_approval boolean default false
buffer_min               int default 10       -- buffer between solo bookings

-- client-only:
acquired_by              text check (acquired_by in ('studio','admin'))
acquired_by_member_id    uuid                 -- which admin brought them in (commission split)
joined_at                timestamptz default now()

-- denormalized for fast dashboards (recomputed by triggers):
ltv_cents                int default 0
last_visit_at            timestamptz
member_since             timestamptz default now()

unique (studio_id, user_id)                  -- one membership per pair
```
Indexes: `(studio_id, role)`, `(user_id, role)`.

### B. Catalog (1 table)

#### `services`
Owned by a single admin (or studio-wide if `admin_member_id` is null).
```
id                  uuid PK
studio_id           uuid not null FK → studios.id
admin_member_id     uuid FK → studio_members.id   -- nullable = studio-wide
name                text not null
description         text
mode                text not null check (mode in ('solo','group'))
default_capacity    int not null check (default_capacity >= 1)
duration_min        int not null check (duration_min > 0)
credits_cost        int not null check (credits_cost >= 0)
gross_price_cents   int not null check (gross_price_cents >= 0)
hue                 int not null default 195
active              boolean not null default true
created_at          timestamptz default now()
```
Indexes: `(studio_id, active)`, `(admin_member_id)`.

### C. Availability (3 tables)

#### `studio_hours`
Studio-wide open/close hours. Owner-managed.
```
studio_id           uuid not null FK → studios.id
weekday             smallint not null check (weekday between 0 and 6)
                                          -- 0 = Sunday … 6 = Saturday
open_time           time
close_time          time
closed              boolean not null default false
PK (studio_id, weekday)
```

#### `availability_rules`
Per-admin recurring working hours. Multiple rows per (admin, weekday) allowed
to model split shifts.
```
id                  uuid PK
studio_id           uuid not null
admin_member_id     uuid not null FK → studio_members.id
weekday             smallint not null check (weekday between 0 and 6)
start_time          time not null
end_time            time not null
                    check (end_time > start_time)
```
Indexes: `(admin_member_id, weekday)`.

#### `availability_exceptions`
One-off blocks (vacation, lunch) or extra hours (special workshop day).
```
id                  uuid PK
studio_id           uuid not null
admin_member_id     uuid not null FK → studio_members.id
date                date not null
start_time          time
end_time            time
type                text not null check (type in ('block','extra'))
reason              text
created_at          timestamptz default now()
```
Indexes: `(admin_member_id, date)`.

### D. Scheduling (3 tables)

#### `sessions`
**One scheduled slot on the calendar.** Solo → capacity 1, 0–1 booking.
Group → capacity N, 0–N bookings.
```
id                  uuid PK
studio_id           uuid not null
service_id          uuid not null FK → services.id
admin_member_id     uuid not null FK → studio_members.id
starts_at           timestamptz not null
duration_min        int not null check (duration_min > 0)
capacity            int not null check (capacity >= 1)
min_to_run          int                            -- group only; cancel if fewer signups
status              text not null default 'scheduled'
                    check (status in ('scheduled','cancelled','done'))
notes               text
recurring_template_id uuid FK → recurring_class_templates.id
created_at          timestamptz default now()
```
Indexes: `(studio_id, starts_at)`, `(admin_member_id, starts_at)`.

**Critical constraint — prevent double-booking the same admin:**
```sql
-- Postgres exclusion constraint
alter table sessions add constraint no_overlap_per_admin exclude using gist (
  admin_member_id with =,
  tstzrange(starts_at, starts_at + (duration_min || ' minutes')::interval) with &&
) where (status != 'cancelled');
```
Requires `btree_gist` extension.

#### `bookings`
A client's enrollment in a session.
```
id                  uuid PK
session_id          uuid not null FK → sessions.id on delete cascade
client_member_id    uuid not null FK → studio_members.id
status              text not null default 'confirmed'
                    check (status in ('confirmed','pending','waitlist','cancelled','attended','no_show'))
credits_charged     int not null
booked_at           timestamptz default now()
cancelled_at        timestamptz
cancellation_reason text
unique (session_id, client_member_id)
```
Indexes: `(session_id)`, `(client_member_id, booked_at desc)`.

**Capacity enforcement** via BEFORE INSERT trigger:
```sql
-- pseudo:
if (select count(*) from bookings where session_id = new.session_id
    and status not in ('cancelled')) >=
   (select capacity from sessions where id = new.session_id)
then raise exception 'session full';
```

#### `recurring_class_templates`
"Yoga every Mon/Wed/Fri at 7am for the next 8 weeks." A scheduled job
generates `sessions` rows from these — never interpreted on the read path.
```
id                  uuid PK
studio_id           uuid not null
service_id          uuid not null FK → services.id
admin_member_id     uuid not null FK → studio_members.id
weekdays            smallint[] not null            -- array of 0..6
start_time          time not null
duration_min        int not null
capacity            int not null
valid_from          date not null
valid_until         date
created_at          timestamptz default now()
```

### E. Offers (the studio's catalog of plans + packs)

#### `subscription_plans`
What the studio offers clients (e.g., "Studio · 8 credits/mo · €89").
```
id                  uuid PK
studio_id           uuid not null
name                text not null
description         text
price_cents         int not null
billing_interval    text not null default 'month'  -- 'month' | 'year'
credits_granted     int not null                   -- per billing period
features            jsonb                          -- string[]
sort_order          int default 0
active              boolean not null default true
ls_variant_id       text                           -- when wired to Lemon Squeezy
created_at          timestamptz default now()
```

#### `credit_packs`
One-off top-ups (e.g., 10 credits for €99).
```
id                  uuid PK
studio_id           uuid not null
credits             int not null
price_cents         int not null
label               text                           -- "Popular", "Best value"
sort_order          int default 0
active              boolean not null default true
ls_variant_id       text
created_at          timestamptz default now()
```

### F. Money (5 tables)

#### `client_subscriptions`
A specific client's subscription to a specific plan.
```
id                  uuid PK
member_id           uuid not null FK → studio_members.id  -- the client
plan_id             uuid not null FK → subscription_plans.id
status              text not null check (status in ('active','past_due','cancelled','expired'))
started_at          timestamptz default now()
current_period_start timestamptz not null
current_period_end  timestamptz not null
cancelled_at        timestamptz
ls_subscription_id  text
created_at          timestamptz default now()
unique (member_id) where status in ('active','past_due')   -- only one active sub per client
```

#### `client_credits`
Current balance per (studio, client). Maintained by triggers on
`credit_transactions`.
```
member_id           uuid PK FK → studio_members.id
balance             int not null default 0 check (balance >= 0)
last_grant_at       timestamptz
updated_at          timestamptz default now()
```

#### `credit_transactions`
The credit ledger. Every credit movement (grant, spend, refund, top-up,
expire) is a row. Balance is a denormalization.
```
id                  uuid PK
member_id           uuid not null FK → studio_members.id
delta               int not null                  -- +ve grant/topup, -ve spend
type                text not null check (type in
                    ('monthly_grant','spend','refund','topup','expire','adjustment'))
description         text not null
related_booking_id  uuid FK → bookings.id
related_payment_id  uuid FK → payments.id
created_at          timestamptz default now()
```
Indexes: `(member_id, created_at desc)`.

#### `payments`
Real money movements **into** the platform. Two streams:
1. SaaS subscriptions (owner pays Maison & Co.)
2. Client purchases (top-ups, plan signups) — only present when integrated; v1 = manual ledger.

```
id                  uuid PK
studio_id           uuid not null
member_id           uuid FK → studio_members.id   -- null = SaaS payment by owner
type                text not null check (type in
                    ('saas_subscription','client_subscription','client_topup','manual'))
amount_cents        int not null
currency            text not null default 'EUR'
status              text not null check (status in ('pending','succeeded','failed','refunded'))
ls_order_id         text
ls_subscription_id  text
description         text
created_at          timestamptz default now()
```

#### `payouts`
Money owed to admins. Generated from a query over `bookings ⋈ services ⋈
studio_members.commission_pct` for a period.
```
id                  uuid PK
studio_id           uuid not null
admin_member_id     uuid not null FK → studio_members.id
period_start        date not null
period_end          date not null
gross_cents         int not null                  -- sum of bookings.gross_price_cents
commission_cents    int not null                  -- gross × commission_pct
fees_cents          int default 0                 -- platform fees, deductions
net_cents           int not null                  -- commission − fees
status              text not null default 'pending' check (status in
                    ('pending','approved','paid','disputed'))
paid_at             timestamptz
unique (admin_member_id, period_start, period_end)
```

### G. SaaS subscription tracking (1 table)

#### `studio_subscriptions`
The owner's subscription to Maison & Co. (the SaaS itself).
```
studio_id           uuid PK FK → studios.id
plan                text not null check (plan in ('free','solo','studio','atelier'))
status              text not null check (status in
                    ('trialing','active','past_due','cancelled','expired'))
ls_subscription_id  text
ls_customer_id      text
trial_ends_at       timestamptz
current_period_end  timestamptz
cancel_at           timestamptz
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### H. Communication (3 tables)

#### `threads`
A chat thread between two members of the same studio.
```
id                  uuid PK
studio_id           uuid not null
last_message_at     timestamptz
created_at          timestamptz default now()
```

#### `thread_participants`
```
thread_id           uuid not null FK → threads.id on delete cascade
member_id           uuid not null FK → studio_members.id
last_read_at        timestamptz default now()
PK (thread_id, member_id)
```

#### `messages`
```
id                  uuid PK
thread_id           uuid not null FK → threads.id on delete cascade
sender_member_id    uuid not null FK → studio_members.id
body                text not null
attachments         jsonb                          -- [{url, kind, size}]
created_at          timestamptz default now()
```
Indexes: `(thread_id, created_at desc)`.

### I. Reviews (1 table)

#### `reviews`
Per-booking client → admin rating. Used to compute `studio_members.avg_rating`
denormalization.
```
id                  uuid PK
booking_id          uuid not null unique FK → bookings.id
client_member_id    uuid not null FK → studio_members.id
admin_member_id     uuid not null FK → studio_members.id
rating              smallint not null check (rating between 1 and 5)
comment             text
created_at          timestamptz default now()
```

### J. Misc

- **`audit_log`** — deferred to v2.
- **`notifications`** — deferred to v2; v1 sends email via Resend instead.
- **`invitations`** — keep this on `studio_members.status='invited'`. The
  invite email contains a token that signs them up and flips the row to
  `active` on first login.

### Postgres extensions to enable

- `uuid-ossp` (uuid generation)
- `citext` (case-insensitive email)
- `btree_gist` (exclusion constraints on time ranges)
- `pgcrypto` (random tokens for invites)

### Counts

**~22 tables for v1**, of which 3 are deferred → ~19 to actually build.

---

## 4. Security model — Row-Level Security (RLS)

**Multi-tenant isolation lives in the database, not the app.** Every domain
table has RLS enabled and a policy keyed off `auth.uid()`. Even if the app
forgets a `where studio_id=` clause, the DB will return zero rows.

### Helper function (used by every policy)

```sql
-- Returns the membership row for the current auth user in the given studio,
-- or null if they're not a member.
create or replace function current_member(target_studio uuid)
returns studio_members
language sql stable security definer as $$
  select * from studio_members
  where user_id = auth.uid() and studio_id = target_studio
    and status = 'active'
$$;
```

### Policy patterns

#### Pattern A — "studio-scoped, any member can read"
For tables where every active member of the studio sees the same data.
Examples: `services`, `subscription_plans`, `credit_packs`, `studio_hours`.
```sql
alter table services enable row level security;

create policy services_read on services for select
  using (current_member(studio_id) is not null);

create policy services_write on services for all
  using (
    exists (select 1 from current_member(studio_id) m
            where m.role in ('owner','admin'))
  );
```

#### Pattern B — "owner-only writes"
`subscription_plans`, `credit_packs`, `studio_hours`, `studios` (other than
member edits) — owner exclusive.
```sql
create policy plans_owner_write on subscription_plans for all
  using (
    exists (select 1 from current_member(studio_id) m where m.role = 'owner')
  );
```

#### Pattern C — "self only"
`users`, `availability_rules`, `availability_exceptions`,
`studio_members.require_booking_approval`. The actor edits their own row.
```sql
create policy availability_self_write on availability_rules for all
  using (
    exists (
      select 1 from studio_members m
      where m.id = availability_rules.admin_member_id
        and m.user_id = auth.uid()
    )
  );
```

#### Pattern D — "scoped to my own bookings/sessions"
`bookings` — clients see their own; admins see the bookings on their sessions;
owners see all.
```sql
create policy bookings_read on bookings for select
  using (
    -- I am the client
    exists (select 1 from studio_members m where m.id = bookings.client_member_id and m.user_id = auth.uid())
    -- or I am the admin on the session
    or exists (
      select 1 from sessions s join studio_members m on m.id = s.admin_member_id
      where s.id = bookings.session_id and m.user_id = auth.uid()
    )
    -- or I am the owner
    or exists (
      select 1 from sessions s
      join studio_members m on m.studio_id = s.studio_id
      where s.id = bookings.session_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );
```

#### Pattern E — "thread participants only"
`messages`, `threads`, `thread_participants`.
```sql
create policy messages_read on messages for select
  using (
    exists (
      select 1 from thread_participants tp
      join studio_members m on m.id = tp.member_id
      where tp.thread_id = messages.thread_id and m.user_id = auth.uid()
    )
  );
```

### Per-table policy summary

| Table | Read | Write |
|---|---|---|
| `studios` | A (any member) | C (owner self) |
| `users` | self | self |
| `studio_members` | A | B (owner) for invites; C (self) for own settings |
| `services` | A | A (owner+admin) — admin can only modify their own rows |
| `studio_hours` | A | B (owner) |
| `availability_rules` | A | C (self admin) |
| `availability_exceptions` | A | C (self admin) |
| `sessions` | A | A (owner+admin) — admin can only modify their own |
| `bookings` | D | D (also clients can insert their own) |
| `subscription_plans`, `credit_packs` | A (where active=true for clients) | B (owner) |
| `client_subscriptions`, `client_credits`, `credit_transactions` | self client + owner | server-only (writes go through Route Handlers using service role) |
| `payments`, `payouts` | owner only | server-only |
| `studio_subscriptions` | owner only | server-only (LS webhook) |
| `threads`, `thread_participants`, `messages` | E | E |
| `reviews` | A | client (their own bookings) |

### Server-only writes via service role

Money tables (`payments`, `payouts`, `credit_transactions`, `studio_subscriptions`)
are written exclusively by the **server role** (Next.js Route Handlers using
`SUPABASE_SERVICE_ROLE_KEY`). RLS for clients is read-only or rejected on writes.
This keeps Lemon Squeezy webhooks and credit ledger integrity in trusted code.

---

## 5. API surface

| Path | Type | Purpose |
|---|---|---|
| Direct Supabase queries | client SDK | Reading sessions, services, bookings, threads, messages, plans, packs, credits ledger. RLS enforces auth. |
| Direct Supabase mutations | client SDK | Insert booking, send message, mark thread read, edit services (admin), edit own profile. |
| **Next.js Route Handlers** (server-only, in `web/app/api/...`) | | |
| `POST /api/bookings/cancel` | server | Cancel + refund credits in a transaction. Touches `bookings`, `credit_transactions`. Could be a Postgres function instead. |
| `POST /api/checkout/plan` | server | Create LS checkout for `client_subscriptions`. Returns redirect URL. |
| `POST /api/checkout/topup` | server | Create LS checkout for `credit_packs`. Returns redirect URL. |
| `POST /api/checkout/saas` | server | Create LS checkout for `studio_subscriptions` (owner upgrades). |
| `POST /api/webhooks/lemon-squeezy` | server | Handle `subscription_*`, `order_*` events. Verify HMAC signature. Write to `payments`, `studio_subscriptions`, `client_subscriptions`, `credit_transactions`. |
| `POST /api/invites/admin` | server | Insert `studio_members(status=invited)`, send email via Resend with signed token. |
| `POST /api/invites/accept` | server | Validate token, flip status to `active`, link `auth.users.id` → `users.id`. |
| `GET  /api/payouts/preview` | server | Calculate next payout for owner UI without creating it. |
| `POST /api/payouts/run` | server | Create `payouts` rows for the closed period. |
| `POST /api/availability/free-slots` | server | Compute free slots for a given (admin, date, service.duration). Read-only, but cheaper as one server-side query than client-side stitching. Could also be a Postgres function exposed via `rpc()`. |

**Rule of thumb:** if the action needs Supabase service role, an LS API key, an
SMTP key, or atomic multi-table writes — it's a Route Handler. Otherwise
direct Supabase.

---

## 6. Realtime

Use **Supabase Realtime** (Postgres replication, free tier) for:

- **Chat (`/admin/messages`, `/client/messages`)** — subscribe to
  `messages` filtered by `thread_id`. Insert is the only event we care about.
- **Calendar live updates** *(v2)* — subscribe to `sessions` and `bookings`
  filtered by `studio_id`. Defer to v2; v1 = refetch on focus + after mutation.

Skip realtime for everything else. It's not free of CPU and adds complexity.

---

## 7. Payments & billing

### Two distinct money flows

**Flow 1 — Owner pays Maison & Co. (the SaaS)**
- LS Store: Maison & Co.'s account.
- Product: "Maison & Co. Subscription" with variants per tier (`solo`, `studio`, `atelier`).
- Owner clicks "Upgrade" in `/owner/settings` → `POST /api/checkout/saas` → LS
  hosted checkout → on success, LS webhook fires → we write `studio_subscriptions`
  + `payments(type='saas_subscription')`.
- Owner manages billing in **LS customer portal** (LS-hosted, we just redirect).

**Flow 2 — Client pays the studio (subscription / top-up)**

Three levels of integration, picked per studio:

1. **Manual ledger (v1 default)** — client pays the studio out-of-band (cash,
   bank transfer, the studio's own Stripe link). Owner records the payment in
   `payments(type='manual')` and grants credits via UI. Zero integration. Good
   enough to ship.
2. **LS-as-owner (v2)** — owner connects their own LS account via OAuth. We
   call LS API on their behalf to create checkouts for `subscription_plans`
   and `credit_packs`. Money lands in owner's LS balance, not ours.
3. **Stripe Connect (v3, optional)** — only if Stripe ever becomes available
   to a Pakistan-based platform. Probably never; skip indefinitely.

### Webhook event handling

LS sends signed events. Verify HMAC against `LEMON_SQUEEZY_SIGNING_SECRET`
before any DB write.

| LS event | Action |
|---|---|
| `subscription_created` | Insert `studio_subscriptions` (or `client_subscriptions`) row |
| `subscription_updated` | Update status, current_period_end |
| `subscription_payment_success` | Insert `payments(status='succeeded')` + grant monthly credits if it's a `client_subscription` |
| `subscription_payment_failed` | Set status `past_due`, send email |
| `subscription_cancelled` | Status `cancelled` (still active until `current_period_end`) |
| `subscription_expired` | Status `expired`, revoke `studios.plan` to `free` |
| `order_created` | Insert `payments(type='client_topup', status='succeeded')`, grant credits |

### Idempotency

LS retries webhooks up to ~5 times. Add `unique(ls_order_id)` and
`unique(ls_subscription_id, type)` constraints on `payments` so the
second-arrival is a no-op.

---

## 8. File uploads & storage

Only one file kind in v1: **avatars**.

- Bucket: `avatars`. RLS: read public, write only to `{auth.uid()}/...`
  prefix.
- `users.avatar_url` stores the public URL (or path; resolve URL client-side).
- Upload component: `<input type="file">` → Supabase Storage SDK →
  update `users.avatar_url`.

**Studio logo (v2)** — same pattern, separate `studio-logos` bucket, owner-only
write.

**Chat attachments** — defer.

---

## 9. Scheduled jobs

| Job | Frequency | Where | Purpose |
|---|---|---|---|
| `monthly-credit-grant` | daily 00:05 UTC | Vercel Cron → `/api/cron/credit-grants` | For every active `client_subscriptions.current_period_end` ≤ now + 5min: grant credits, advance `current_period_*`, log `credit_transactions(type='monthly_grant')` |
| `recurring-class-expand` | nightly | Vercel Cron → `/api/cron/expand-recurring` | Generate the next 14 days of `sessions` from `recurring_class_templates` |
| `payout-period-close` | 1st of month, 04:00 UTC | Vercel Cron | Close last month's bookings, create `payouts` rows |
| `booking-reminders` | every 15min | Vercel Cron → `/api/cron/reminders` | 24h-before and 1h-before reminders for confirmed bookings |
| `expire-credits` | nightly | Vercel Cron | If pack credits have a TTL (configurable per studio); v1 = no expiry → skip |

All of these are short Route Handlers calling Supabase RPC functions.

---

## 10. Migration plan — mocks → real

Five phases. Each phase is shippable on its own.

### Phase 0 — Foundation (1–2 days)

- [ ] Create Supabase project, enable extensions (`uuid-ossp`, `citext`, `btree_gist`).
- [ ] Set up `web/.env.local` and `web/.env.example` for `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Install `@supabase/supabase-js` and create `web/lib/supabase/client.ts`
      (browser) and `web/lib/supabase/server.ts` (server).
- [ ] Create `supabase/migrations/0001_init.sql` containing **all** A–I tables,
      indexes, exclusion constraint, capacity trigger, helper functions.
- [ ] Add `supabase` CLI for migrations (or use Supabase Studio → push to
      Postgres → snapshot back to migrations).
- [ ] Create `seed.sql` that inserts one studio + Camille (admin) + Olivia
      (client) + a few services so the app boots non-empty in dev.

### Phase 1 — Identity (2–3 days)

- [ ] Wire Supabase Auth. Replace mock auth in `(auth)/login`, `(auth)/signup`,
      `(auth)/forgot-password`.
- [ ] On signup: trigger inserts `users` + `studios` + `studio_members(role=owner)`
      atomically (Postgres function).
- [ ] Replace `ROLE_CONFIGS` in [lib/roles.ts](lib/roles.ts) usage with a
      `useCurrentMember()` hook reading `studio_members ⋈ users` for the
      current `auth.uid()`.
- [ ] Sign-out actually clears the session.
- [ ] Profile menu reads real user data; profile/email edits go to Supabase.

### Phase 2 — Catalog & calendar reads (3–4 days)

- [ ] Replace `SERVICES` in `lib/data.ts` with `from('services')` queries.
- [ ] Replace `SERVICES`-driven UI in `ServicesPanel`, `client/book` Classes
      tab, `NewClassSheet` with real reads.
- [ ] Implement free-slot computation (Postgres RPC), wire to `/client/book`
      1-on-1 flow.
- [ ] Replace `CALENDAR_EVENTS`, `ADMIN_TODAY` with real `sessions ⋈ bookings`
      reads filtered by studio + admin + date range.
- [ ] Working hours editor (`/admin/settings`) → writes
      `availability_rules`, `availability_exceptions`.

### Phase 3 — Bookings & sessions (3–4 days)

- [ ] Client booking insert flow (1-on-1): `Postgres function book_solo(...)`
      that creates a session + booking + credit_transaction in one
      transaction. RLS-respecting.
- [ ] Client enrollment flow (group): `book_class(session_id)` — inserts
      booking, debits credits, fails if session full or client over-credit.
- [ ] Admin `/admin/calendar` "+ New class" → real `sessions` insert.
- [ ] Cancel booking flow with refund window logic.
- [ ] Reschedule (cancel + book new).
- [ ] `bookings` exclusion + capacity test cases.

### Phase 4 — Money & finance (3–4 days)

- [ ] CRUD `subscription_plans`, `credit_packs` from `/owner/offers`.
- [ ] Manual `payments` entry + credit grant from `/owner/clients/[id]` for
      v1 (no checkout). Lets the studio collect cash / external transfer and
      still show credits in app.
- [ ] LS integration for SaaS subscription only (Phase 5 covers client-side LS).
- [ ] `/owner/finance` reads from real `payments` + `payouts`.
- [ ] `/admin/earnings` reads from a `statements` view.
- [ ] Payout calculation Postgres function + cron.

### Phase 5 — Communication & polish (2–3 days)

- [ ] Real chat: `threads`, `thread_participants`, `messages`.
- [ ] Realtime subscription on active thread.
- [ ] Reviews: post-booking modal → `reviews` insert.
- [ ] Avatar upload to Supabase Storage.
- [ ] Empty-state polish per page.
- [ ] Replace remaining mock data references with real queries.

### Phase 6 — Production hardening (ongoing)

- [ ] Lemon Squeezy webhooks live, verified HMAC, idempotent.
- [ ] Customer portal redirect.
- [ ] Email templates: invite, booking confirmation, reminder, payment receipt.
- [ ] Audit log (deferred until needed).
- [ ] Notifications (deferred; email-only v1).
- [ ] Mobile app: same SDK calls, same RLS rules, same backend. Build with
      Expo when ready.

---

## 11. Open questions for the founder

These are decisions I made tentatively in the schema. Push back on any of
them before Phase 0:

1. **Multi-studio per user** — I built `studio_members` so one human can be
   a client of Studio A and an admin at Studio B. **Confirm this is fine** —
   it's the correct long-term shape but you might want to lock to one studio
   per user for v1 simplicity.
2. **Tipping** — `/admin/earnings` shows a "Tips" stat. Out of scope for v1?
   I assumed yes. If in scope, add a `tip_cents` column on `bookings`.
3. **Service pricing ownership** — I put `gross_price_cents` on `services`,
   set by the admin who owns the service. Owner sees aggregated revenue but
   doesn't override individual prices. Sound right?
4. **Credit expiry** — top-up credits never expire in v1. Subscription
   credits roll over or reset? I assumed **reset on renewal** (you grant 8
   credits, unused ones expire when the period rolls). If they roll over,
   `client_credits.balance` accumulates instead.
5. **Refund policy** — when a client cancels >24h before, refund credits.
   Inside 24h, no refund. Configurable per studio? V1 = hardcoded 24h
   policy; v2 = configurable.
6. **Payouts period** — monthly is what I assumed. Some studios will want
   weekly or bi-weekly. V1 = monthly only.
7. **Owner-as-admin** — can the owner also provide services as an admin?
   Schema-wise yes (insert `studio_members(role=admin)` for the owner's
   user_id). UI doesn't expose this yet. **Probably not v1.**

Save your answers; the schema bends to fit them.

---

## 12. What's *not* in this plan

Things I deliberately deferred:

- **Notifications system** — email via Resend is enough for v1. In-app
  push/banner system is v2.
- **Audit log** — useful for support but not user-visible. v2.
- **Search** — basic `ilike` is fine for v1 client lists. Full-text /
  Algolia later.
- **Reporting / analytics** — owner dashboard reads from live data. Tinybird
  or ClickHouse comes when scale demands it (probably year 2+).
- **Admin marketplace / public studio directory** — out of scope.
- **Multi-language content** — we have `users.locale` and `studios.locale`
  but no translation pipeline. v2.
- **Two-factor auth** — Supabase Auth supports it; UI in `/admin/settings`
  exists but doesn't wire up. v2.

---

## 13. What to read after this

- [PROJECT.md](PROJECT.md) — the route inventory + what's mocked.
- [design-system/MASTER.md](design-system/MASTER.md) — UI rules; relevant
  whenever you build a new admin/owner tool (e.g. invite flow).
- Supabase docs: RLS, Realtime, Storage.
- Lemon Squeezy webhook docs (signing, idempotency).
