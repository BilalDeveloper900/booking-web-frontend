-- ─────────────────────────────────────────────────────────────────────────────
-- Book It Daily — Row-Level Security policies
-- See web/BACKEND-PLAN.md §4 for the policy patterns.
-- Money tables (payments, payouts, credit_transactions, studio_subscriptions,
-- client_subscriptions) are write-only via service role from Route Handlers.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on every public table.
alter table public.studios                  enable row level security;
alter table public.users                    enable row level security;
alter table public.studio_members           enable row level security;
alter table public.services                 enable row level security;
alter table public.studio_hours             enable row level security;
alter table public.availability_rules       enable row level security;
alter table public.availability_exceptions  enable row level security;
alter table public.recurring_class_templates enable row level security;
alter table public.sessions                 enable row level security;
alter table public.bookings                 enable row level security;
alter table public.subscription_plans       enable row level security;
alter table public.credit_packs             enable row level security;
alter table public.client_subscriptions     enable row level security;
alter table public.client_credits           enable row level security;
alter table public.payments                 enable row level security;
alter table public.credit_transactions      enable row level security;
alter table public.payouts                  enable row level security;
alter table public.studio_subscriptions     enable row level security;
alter table public.threads                  enable row level security;
alter table public.thread_participants      enable row level security;
alter table public.messages                 enable row level security;
alter table public.reviews                  enable row level security;


-- ─────────────────────────────────────────────────────────────────────────────
-- studios — any active member reads; only owner writes
-- ─────────────────────────────────────────────────────────────────────────────

create policy studios_select on public.studios
  for select using (public.is_member_of(id));

create policy studios_owner_update on public.studios
  for update using (public.my_role_in(id) = 'owner')
  with check (public.my_role_in(id) = 'owner');


-- ─────────────────────────────────────────────────────────────────────────────
-- users — readable by anyone who shares a studio with you; self-edit only
-- ─────────────────────────────────────────────────────────────────────────────

create policy users_select_self on public.users
  for select using (id = auth.uid());

create policy users_select_co_member on public.users
  for select using (
    exists (
      select 1
      from public.studio_members me
      join public.studio_members them on them.studio_id = me.studio_id
      where me.user_id = auth.uid()
        and me.status = 'active'
        and them.user_id = public.users.id
    )
  );

create policy users_update_self on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- studio_members — read all in your studio; owner-write for invites; self-edit
-- ─────────────────────────────────────────────────────────────────────────────

create policy studio_members_select on public.studio_members
  for select using (public.is_member_of(studio_id));

create policy studio_members_insert_owner on public.studio_members
  for insert with check (
    public.my_role_in(studio_id) = 'owner'
  );

create policy studio_members_update_owner on public.studio_members
  for update using (public.my_role_in(studio_id) = 'owner')
  with check (public.my_role_in(studio_id) = 'owner');

create policy studio_members_update_self on public.studio_members
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- services — any member reads active; admin writes their own; owner writes any
-- ─────────────────────────────────────────────────────────────────────────────

create policy services_select on public.services
  for select using (public.is_member_of(studio_id));

create policy services_insert on public.services
  for insert with check (
    public.my_role_in(studio_id) in ('admin','owner')
    and (
      public.my_role_in(studio_id) = 'owner'
      or admin_member_id = (
        select id from public.studio_members
        where user_id = auth.uid() and studio_id = services.studio_id
      )
    )
  );

create policy services_update on public.services
  for update using (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id = (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = services.studio_id
    )
  )
  with check (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id = (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = services.studio_id
    )
  );

create policy services_delete on public.services
  for delete using (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id = (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = services.studio_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- studio_hours — any member reads; owner writes
-- ─────────────────────────────────────────────────────────────────────────────

create policy studio_hours_select on public.studio_hours
  for select using (public.is_member_of(studio_id));

create policy studio_hours_owner_write on public.studio_hours
  for all using (public.my_role_in(studio_id) = 'owner')
  with check (public.my_role_in(studio_id) = 'owner');


-- ─────────────────────────────────────────────────────────────────────────────
-- availability_rules — readable by members; the admin owns their own
-- ─────────────────────────────────────────────────────────────────────────────

create policy availability_rules_select on public.availability_rules
  for select using (public.is_member_of(studio_id));

create policy availability_rules_self_write on public.availability_rules
  for all using (
    admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = availability_rules.studio_id
    )
  )
  with check (
    admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = availability_rules.studio_id
    )
  );

create policy availability_exceptions_select on public.availability_exceptions
  for select using (public.is_member_of(studio_id));

create policy availability_exceptions_self_write on public.availability_exceptions
  for all using (
    admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = availability_exceptions.studio_id
    )
  )
  with check (
    admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = availability_exceptions.studio_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- recurring_class_templates — admin manages own; owner manages all
-- ─────────────────────────────────────────────────────────────────────────────

create policy rct_select on public.recurring_class_templates
  for select using (public.is_member_of(studio_id));

create policy rct_self_or_owner_write on public.recurring_class_templates
  for all using (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = recurring_class_templates.studio_id
    )
  )
  with check (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = recurring_class_templates.studio_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- sessions — any member reads; admin writes own; owner writes any
-- ─────────────────────────────────────────────────────────────────────────────

create policy sessions_select on public.sessions
  for select using (public.is_member_of(studio_id));

create policy sessions_self_or_owner_write on public.sessions
  for all using (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = sessions.studio_id
    )
  )
  with check (
    public.my_role_in(studio_id) = 'owner'
    or admin_member_id in (
      select id from public.studio_members
      where user_id = auth.uid() and studio_id = sessions.studio_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- bookings — client sees own; admin sees own session bookings; owner sees all
-- ─────────────────────────────────────────────────────────────────────────────

create policy bookings_select on public.bookings
  for select using (
    -- I am the client on this booking
    exists (
      select 1 from public.studio_members m
      where m.id = bookings.client_member_id and m.user_id = auth.uid()
    )
    -- or I am the admin on the session
    or exists (
      select 1 from public.sessions s
      join public.studio_members m on m.id = s.admin_member_id
      where s.id = bookings.session_id and m.user_id = auth.uid()
    )
    -- or I am the owner of the studio
    or exists (
      select 1 from public.sessions s
      where s.id = bookings.session_id and public.my_role_in(s.studio_id) = 'owner'
    )
  );

-- Clients can insert bookings for themselves.
create policy bookings_insert_client on public.bookings
  for insert with check (
    client_member_id in (
      select id from public.studio_members where user_id = auth.uid() and status = 'active'
    )
  );

-- Admin / owner can insert bookings on their sessions (e.g. walk-in, manual booking).
create policy bookings_insert_admin on public.bookings
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (
          public.my_role_in(s.studio_id) = 'owner'
          or s.admin_member_id in (
            select id from public.studio_members
            where user_id = auth.uid() and studio_id = s.studio_id
          )
        )
    )
  );

-- Update / cancel: client (own), admin (own session), owner.
create policy bookings_update on public.bookings
  for update using (
    exists (
      select 1 from public.studio_members m
      where m.id = bookings.client_member_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.sessions s
      join public.studio_members m on m.id = s.admin_member_id
      where s.id = bookings.session_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.sessions s
      where s.id = bookings.session_id and public.my_role_in(s.studio_id) = 'owner'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- subscription_plans / credit_packs — members read active; owner writes
-- ─────────────────────────────────────────────────────────────────────────────

create policy plans_select on public.subscription_plans
  for select using (public.is_member_of(studio_id));

create policy plans_owner_write on public.subscription_plans
  for all using (public.my_role_in(studio_id) = 'owner')
  with check (public.my_role_in(studio_id) = 'owner');

create policy packs_select on public.credit_packs
  for select using (public.is_member_of(studio_id));

create policy packs_owner_write on public.credit_packs
  for all using (public.my_role_in(studio_id) = 'owner')
  with check (public.my_role_in(studio_id) = 'owner');


-- ─────────────────────────────────────────────────────────────────────────────
-- Money tables — read by self/owner; write only via service_role
-- ─────────────────────────────────────────────────────────────────────────────

-- client_subscriptions: client sees own; owner sees all in their studio.
create policy client_subs_select on public.client_subscriptions
  for select using (
    exists (
      select 1 from public.studio_members m
      where m.id = client_subscriptions.member_id
        and (m.user_id = auth.uid() or public.my_role_in(m.studio_id) = 'owner')
    )
  );
-- (no insert/update/delete policy → only service role can write)

-- client_credits: same access pattern.
create policy client_credits_select on public.client_credits
  for select using (
    exists (
      select 1 from public.studio_members m
      where m.id = client_credits.member_id
        and (m.user_id = auth.uid() or public.my_role_in(m.studio_id) = 'owner')
    )
  );

create policy credit_tx_select on public.credit_transactions
  for select using (
    exists (
      select 1 from public.studio_members m
      where m.id = credit_transactions.member_id
        and (m.user_id = auth.uid() or public.my_role_in(m.studio_id) = 'owner')
    )
  );

-- payments / payouts / studio_subscriptions: owner-only read.
create policy payments_owner_select on public.payments
  for select using (public.my_role_in(studio_id) = 'owner');

create policy payouts_owner_select on public.payouts
  for select using (public.my_role_in(studio_id) = 'owner');

create policy studio_subs_owner_select on public.studio_subscriptions
  for select using (public.my_role_in(studio_id) = 'owner');


-- ─────────────────────────────────────────────────────────────────────────────
-- Communication — thread participants only
-- ─────────────────────────────────────────────────────────────────────────────

create policy threads_select on public.threads
  for select using (
    exists (
      select 1 from public.thread_participants tp
      join public.studio_members m on m.id = tp.member_id
      where tp.thread_id = threads.id and m.user_id = auth.uid()
    )
  );

create policy threads_insert on public.threads
  for insert with check (public.is_member_of(studio_id));

create policy thread_participants_select on public.thread_participants
  for select using (
    exists (
      select 1 from public.studio_members m
      where m.id = thread_participants.member_id and m.user_id = auth.uid()
    )
    or exists (
      -- I'm in this thread (so I can see who else is in it)
      select 1 from public.thread_participants mine
      join public.studio_members m on m.id = mine.member_id
      where mine.thread_id = thread_participants.thread_id and m.user_id = auth.uid()
    )
  );

create policy thread_participants_insert on public.thread_participants
  for insert with check (
    -- creating my own participant row
    exists (
      select 1 from public.studio_members m
      where m.id = thread_participants.member_id and m.user_id = auth.uid()
    )
    -- or another participant in this thread is creating it (e.g. owner adding)
    or exists (
      select 1 from public.thread_participants mine
      join public.studio_members m on m.id = mine.member_id
      where mine.thread_id = thread_participants.thread_id and m.user_id = auth.uid()
    )
  );

create policy thread_participants_update_self on public.thread_participants
  for update using (
    exists (
      select 1 from public.studio_members m
      where m.id = thread_participants.member_id and m.user_id = auth.uid()
    )
  );

create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.thread_participants tp
      join public.studio_members m on m.id = tp.member_id
      where tp.thread_id = messages.thread_id and m.user_id = auth.uid()
    )
  );

create policy messages_insert on public.messages
  for insert with check (
    -- I am the sender, and I'm a participant of this thread
    exists (
      select 1 from public.studio_members m
      where m.id = messages.sender_member_id and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = messages.thread_id and tp.member_id = messages.sender_member_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Reviews — client writes own; everyone in the studio reads
-- ─────────────────────────────────────────────────────────────────────────────

create policy reviews_select on public.reviews
  for select using (
    exists (
      select 1 from public.bookings b
      join public.sessions s on s.id = b.session_id
      where b.id = reviews.booking_id and public.is_member_of(s.studio_id)
    )
  );

create policy reviews_insert_self on public.reviews
  for insert with check (
    client_member_id in (
      select id from public.studio_members where user_id = auth.uid() and status = 'active'
    )
  );
