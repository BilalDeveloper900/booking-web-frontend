-- =============================================================================
-- Maison & Co. -- initial schema
-- See web/BACKEND-PLAN.md section 3 for the full design rationale.
-- =============================================================================

-- Extensions. uuid-ossp is intentionally NOT used -- gen_random_uuid() ships
-- with Postgres 13+ and lives in pg_catalog (always in search_path).
-- pgcrypto / citext / btree_gist must be enabled before any reference below.
create extension if not exists citext;
create extension if not exists btree_gist;
create extension if not exists pgcrypto;


-- -----------------------------------------------------------------------------
-- A. Identity & tenancy
-- -----------------------------------------------------------------------------

create table public.studios (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  owner_id      uuid not null,
  country       text,
  timezone      text not null default 'UTC',
  locale        text not null default 'en-US',
  currency      text not null default 'EUR',
  logo_url      text,
  created_at    timestamptz not null default now()
);

create table public.users (
  id            uuid primary key,                  -- matches auth.users.id
  email         citext not null unique,
  name          text not null,
  avatar_hue    int not null default 195,
  avatar_url    text,
  phone         text,
  locale        text,
  created_at    timestamptz not null default now()
);

-- Late-bound FK so studios.owner_id references users(id) (cyclic by design).
alter table public.studios
  add constraint studios_owner_id_fkey foreign key (owner_id) references public.users(id);

create table public.studio_members (
  id                          uuid primary key default gen_random_uuid(),
  studio_id                   uuid not null references public.studios(id) on delete cascade,
  user_id                     uuid not null references public.users(id) on delete cascade,
  role                        text not null check (role in ('owner','admin','client')),
  status                      text not null default 'active'
                              check (status in ('active','invited','suspended')),
  invited_by                  uuid references public.users(id),
  -- admin-only:
  specialty                   text,
  commission_pct              numeric(5,2) check (commission_pct between 0 and 100),
  monthly_fee_cents           int,
  require_booking_approval    boolean not null default false,
  buffer_min                  int not null default 10,
  -- client-only:
  acquired_by                 text check (acquired_by in ('studio','admin')),
  acquired_by_member_id       uuid,                -- references studio_members.id (set later)
  joined_at                   timestamptz not null default now(),
  -- denormalized:
  ltv_cents                   int not null default 0,
  last_visit_at               timestamptz,
  member_since                timestamptz not null default now(),
  unique (studio_id, user_id)
);
create index studio_members_role_idx on public.studio_members (studio_id, role);
create index studio_members_user_idx on public.studio_members (user_id, role);

alter table public.studio_members
  add constraint studio_members_acquired_by_member_fkey
  foreign key (acquired_by_member_id) references public.studio_members(id);


-- -----------------------------------------------------------------------------
-- B. Catalog
-- -----------------------------------------------------------------------------

create table public.services (
  id                    uuid primary key default gen_random_uuid(),
  studio_id             uuid not null references public.studios(id) on delete cascade,
  admin_member_id       uuid references public.studio_members(id) on delete set null,
  name                  text not null,
  description           text,
  mode                  text not null check (mode in ('solo','group')),
  default_capacity      int not null check (default_capacity >= 1),
  duration_min          int not null check (duration_min > 0),
  credits_cost          int not null check (credits_cost >= 0),
  gross_price_cents     int not null check (gross_price_cents >= 0),
  hue                   int not null default 195,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);
create index services_active_idx on public.services (studio_id, active);
create index services_admin_idx  on public.services (admin_member_id);


-- -----------------------------------------------------------------------------
-- C. Availability
-- -----------------------------------------------------------------------------

create table public.studio_hours (
  studio_id     uuid not null references public.studios(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  open_time     time,
  close_time    time,
  closed        boolean not null default false,
  primary key (studio_id, weekday),
  check ((closed) or (open_time is not null and close_time is not null and close_time > open_time))
);

create table public.availability_rules (
  id              uuid primary key default gen_random_uuid(),
  studio_id       uuid not null references public.studios(id) on delete cascade,
  admin_member_id uuid not null references public.studio_members(id) on delete cascade,
  weekday         smallint not null check (weekday between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  check (end_time > start_time)
);
create index availability_rules_admin_weekday_idx
  on public.availability_rules (admin_member_id, weekday);

create table public.availability_exceptions (
  id              uuid primary key default gen_random_uuid(),
  studio_id       uuid not null references public.studios(id) on delete cascade,
  admin_member_id uuid not null references public.studio_members(id) on delete cascade,
  date            date not null,
  start_time      time,
  end_time        time,
  type            text not null check (type in ('block','extra')),
  reason          text,
  created_at      timestamptz not null default now()
);
create index availability_exceptions_admin_date_idx
  on public.availability_exceptions (admin_member_id, date);


-- -----------------------------------------------------------------------------
-- D. Scheduling
-- -----------------------------------------------------------------------------

create table public.recurring_class_templates (
  id                  uuid primary key default gen_random_uuid(),
  studio_id           uuid not null references public.studios(id) on delete cascade,
  service_id          uuid not null references public.services(id) on delete cascade,
  admin_member_id     uuid not null references public.studio_members(id) on delete cascade,
  weekdays            smallint[] not null,
  start_time          time not null,
  duration_min        int not null check (duration_min > 0),
  capacity            int not null check (capacity >= 1),
  valid_from          date not null,
  valid_until         date,
  created_at          timestamptz not null default now()
);

create table public.sessions (
  id                      uuid primary key default gen_random_uuid(),
  studio_id               uuid not null references public.studios(id) on delete cascade,
  service_id              uuid not null references public.services(id),
  admin_member_id         uuid not null references public.studio_members(id),
  starts_at               timestamptz not null,
  duration_min            int not null check (duration_min > 0),
  capacity                int not null check (capacity >= 1),
  min_to_run              int,
  status                  text not null default 'scheduled'
                          check (status in ('scheduled','cancelled','done')),
  notes                   text,
  recurring_template_id   uuid references public.recurring_class_templates(id) on delete set null,
  created_at              timestamptz not null default now()
);
create index sessions_studio_starts_idx on public.sessions (studio_id, starts_at);
create index sessions_admin_starts_idx  on public.sessions (admin_member_id, starts_at);

-- Prevent the same admin from being booked into two overlapping sessions.
-- Postgres marks `timestamptz + interval` as STABLE (timezone dependent) so we
-- wrap the range expression in an IMMUTABLE helper function. Safe in practice:
-- timezone changes don't shift the physical timestamps already stored.
create or replace function public.session_range(p_starts timestamptz, p_duration int)
returns tstzrange
language sql immutable strict
as $$
  select tstzrange(p_starts, p_starts + make_interval(mins => p_duration))
$$;

alter table public.sessions
  add constraint sessions_no_overlap_per_admin
  exclude using gist (
    admin_member_id with =,
    public.session_range(starts_at, duration_min) with &&
  )
  where (status <> 'cancelled');

create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.sessions(id) on delete cascade,
  client_member_id      uuid not null references public.studio_members(id) on delete cascade,
  status                text not null default 'confirmed'
                        check (status in ('confirmed','pending','waitlist','cancelled','attended','no_show')),
  credits_charged       int not null check (credits_charged >= 0),
  booked_at             timestamptz not null default now(),
  cancelled_at          timestamptz,
  cancellation_reason   text,
  unique (session_id, client_member_id)
);
create index bookings_session_idx on public.bookings (session_id);
create index bookings_client_idx  on public.bookings (client_member_id, booked_at desc);

-- Capacity enforcement trigger.
create or replace function public.enforce_session_capacity()
returns trigger language plpgsql as $$
declare
  cap int;
  cnt int;
begin
  if (new.status in ('cancelled')) then
    return new;
  end if;
  select capacity into cap from public.sessions where id = new.session_id;
  select count(*) into cnt from public.bookings
    where session_id = new.session_id
      and status not in ('cancelled')
      and (tg_op = 'INSERT' or id <> new.id);
  if cnt + 1 > cap then
    raise exception 'session_full' using errcode = '23514',
      message = format('Session %s is full (%s/%s seats)', new.session_id, cnt + 1, cap);
  end if;
  return new;
end;
$$;

create trigger bookings_capacity_check
before insert or update on public.bookings
for each row execute function public.enforce_session_capacity();


-- -----------------------------------------------------------------------------
-- E. Offers
-- -----------------------------------------------------------------------------

create table public.subscription_plans (
  id                  uuid primary key default gen_random_uuid(),
  studio_id           uuid not null references public.studios(id) on delete cascade,
  name                text not null,
  description         text,
  price_cents         int not null check (price_cents >= 0),
  billing_interval    text not null default 'month' check (billing_interval in ('month','year')),
  credits_granted     int not null check (credits_granted >= 0),
  features            jsonb,
  sort_order          int not null default 0,
  active              boolean not null default true,
  ls_variant_id       text,
  created_at          timestamptz not null default now()
);

create table public.credit_packs (
  id                  uuid primary key default gen_random_uuid(),
  studio_id           uuid not null references public.studios(id) on delete cascade,
  credits             int not null check (credits > 0),
  price_cents         int not null check (price_cents >= 0),
  label               text,
  sort_order          int not null default 0,
  active              boolean not null default true,
  ls_variant_id       text,
  created_at          timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- F. Money -- client
-- -----------------------------------------------------------------------------

create table public.client_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  member_id               uuid not null references public.studio_members(id) on delete cascade,
  plan_id                 uuid not null references public.subscription_plans(id),
  status                  text not null check (status in ('active','past_due','cancelled','expired')),
  started_at              timestamptz not null default now(),
  current_period_start    timestamptz not null,
  current_period_end      timestamptz not null,
  cancelled_at            timestamptz,
  ls_subscription_id      text,
  created_at              timestamptz not null default now()
);
-- only one active/past_due sub per member
create unique index client_subscriptions_active_per_member
  on public.client_subscriptions (member_id)
  where status in ('active','past_due');

create table public.client_credits (
  member_id     uuid primary key references public.studio_members(id) on delete cascade,
  balance       int not null default 0 check (balance >= 0),
  last_grant_at timestamptz,
  updated_at    timestamptz not null default now()
);

create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  studio_id               uuid not null references public.studios(id) on delete cascade,
  member_id               uuid references public.studio_members(id),
  type                    text not null check (type in
                          ('saas_subscription','client_subscription','client_topup','manual')),
  amount_cents            int not null check (amount_cents >= 0),
  currency                text not null default 'EUR',
  status                  text not null check (status in ('pending','succeeded','failed','refunded')),
  ls_order_id             text,
  ls_subscription_id      text,
  description             text,
  created_at              timestamptz not null default now(),
  unique (ls_order_id)    -- LS webhook idempotency
);
create index payments_studio_created_idx on public.payments (studio_id, created_at desc);

create table public.credit_transactions (
  id                      uuid primary key default gen_random_uuid(),
  member_id               uuid not null references public.studio_members(id) on delete cascade,
  delta                   int not null,
  type                    text not null check (type in
                          ('monthly_grant','spend','refund','topup','expire','adjustment')),
  description             text not null,
  related_booking_id      uuid references public.bookings(id) on delete set null,
  related_payment_id      uuid references public.payments(id) on delete set null,
  created_at              timestamptz not null default now()
);
create index credit_transactions_member_idx
  on public.credit_transactions (member_id, created_at desc);

-- Maintain client_credits.balance from credit_transactions.
create or replace function public.apply_credit_transaction()
returns trigger language plpgsql as $$
begin
  insert into public.client_credits (member_id, balance, last_grant_at, updated_at)
  values (new.member_id, greatest(0, new.delta), case when new.delta > 0 then now() end, now())
  on conflict (member_id) do update
    set balance = greatest(0, public.client_credits.balance + new.delta),
        last_grant_at = case when new.delta > 0 then now() else public.client_credits.last_grant_at end,
        updated_at = now();
  return new;
end;
$$;

create trigger credit_transactions_apply
after insert on public.credit_transactions
for each row execute function public.apply_credit_transaction();


-- -----------------------------------------------------------------------------
-- G. Money -- owner / payouts
-- -----------------------------------------------------------------------------

create table public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  studio_id           uuid not null references public.studios(id) on delete cascade,
  admin_member_id     uuid not null references public.studio_members(id) on delete cascade,
  period_start        date not null,
  period_end          date not null,
  gross_cents         int not null check (gross_cents >= 0),
  commission_cents    int not null check (commission_cents >= 0),
  fees_cents          int not null default 0,
  net_cents           int not null,
  status              text not null default 'pending'
                      check (status in ('pending','approved','paid','disputed')),
  paid_at             timestamptz,
  unique (admin_member_id, period_start, period_end)
);

create table public.studio_subscriptions (
  studio_id               uuid primary key references public.studios(id) on delete cascade,
  plan                    text not null check (plan in ('free','solo','studio','atelier')),
  status                  text not null check (status in
                          ('trialing','active','past_due','cancelled','expired')),
  ls_subscription_id      text,
  ls_customer_id          text,
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  cancel_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- H. Communication
-- -----------------------------------------------------------------------------

create table public.threads (
  id              uuid primary key default gen_random_uuid(),
  studio_id       uuid not null references public.studios(id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create table public.thread_participants (
  thread_id      uuid not null references public.threads(id) on delete cascade,
  member_id      uuid not null references public.studio_members(id) on delete cascade,
  last_read_at   timestamptz not null default now(),
  primary key (thread_id, member_id)
);

create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  thread_id           uuid not null references public.threads(id) on delete cascade,
  sender_member_id    uuid not null references public.studio_members(id) on delete cascade,
  body                text not null,
  attachments         jsonb,
  created_at          timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, created_at desc);

-- Bump threads.last_message_at on new message.
create or replace function public.bump_thread_last_message()
returns trigger language plpgsql as $$
begin
  update public.threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

create trigger messages_bump_thread
after insert on public.messages
for each row execute function public.bump_thread_last_message();


-- -----------------------------------------------------------------------------
-- I. Reviews
-- -----------------------------------------------------------------------------

create table public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null unique references public.bookings(id) on delete cascade,
  client_member_id    uuid not null references public.studio_members(id) on delete cascade,
  admin_member_id     uuid not null references public.studio_members(id) on delete cascade,
  rating              smallint not null check (rating between 1 and 5),
  comment             text,
  created_at          timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- Helper functions for app code
-- -----------------------------------------------------------------------------

-- Returns the studio_member row for the current auth user in a studio.
-- Used by every RLS policy.
create or replace function public.current_member(target_studio uuid)
returns public.studio_members
language sql stable security definer
set search_path = public, pg_temp
as $$
  select *
  from public.studio_members
  where user_id = auth.uid()
    and studio_id = target_studio
    and status = 'active'
$$;

-- Fast helper: do I (auth.uid()) belong to this studio?
create or replace function public.is_member_of(target_studio uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.studio_members
    where user_id = auth.uid() and studio_id = target_studio and status = 'active'
  )
$$;

-- Fast helper: what is my role in this studio?
create or replace function public.my_role_in(target_studio uuid)
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select role from public.studio_members
  where user_id = auth.uid() and studio_id = target_studio and status = 'active'
  limit 1
$$;


-- -----------------------------------------------------------------------------
-- Auth bootstrap
-- -----------------------------------------------------------------------------

-- When a new auth.users row is created, mirror it into public.users.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();


-- Convenience: provision a studio + owner membership for an existing user.
-- Called from /api/signup or via Postgres function from the client.
create or replace function public.create_studio_for_owner(
  p_user_id uuid,
  p_studio_name text,
  p_slug text
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_studio_id uuid;
begin
  insert into public.studios (name, slug, owner_id)
  values (p_studio_name, p_slug, p_user_id)
  returning id into v_studio_id;

  insert into public.studio_members (studio_id, user_id, role, status)
  values (v_studio_id, p_user_id, 'owner', 'active');

  insert into public.studio_subscriptions (studio_id, plan, status, trial_ends_at)
  values (v_studio_id, 'free', 'trialing', now() + interval '14 days');

  return v_studio_id;
end;
$$;
