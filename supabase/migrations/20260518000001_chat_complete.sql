-- =============================================================================
-- Book It Daily -- chat completeness pass
--
-- 1. messages columns
--    - sender_role text       (denormalized from studio_members; trigger-filled)
--    - kind text              ('text' | 'booking_event')
--    - attached_booking_id    (optional FK to bookings, for booking_event)
-- 2. Owner RLS — owners SELECT/INSERT in all studio threads without being a
--    participant. They're an implicit watcher with reply rights.
-- 3. studio_threads_overview(p_filter) RPC for the owner inbox view.
-- 4. bookings_auto_chat trigger — auto-posts a chat message in the
--    admin↔client thread when a booking is created or cancelled. Creates the
--    thread on the fly if needed.
-- =============================================================================


-- ── 1. messages: sender_role + kind + attached_booking_id ────────────────────

alter table public.messages
  add column if not exists sender_role text,
  add column if not exists kind text not null default 'text'
    check (kind in ('text','booking_event')),
  add column if not exists attached_booking_id uuid
    references public.bookings(id) on delete set null;

-- Backfill sender_role for existing rows.
update public.messages m
   set sender_role = sm.role
  from public.studio_members sm
 where sm.id = m.sender_member_id
   and m.sender_role is null;

-- Trigger: fill sender_role on insert from studio_members.role
create or replace function public.fill_message_sender_role()
returns trigger language plpgsql as $$
begin
  if new.sender_role is null then
    select role into new.sender_role
      from public.studio_members
     where id = new.sender_member_id;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_fill_sender_role on public.messages;
create trigger messages_fill_sender_role
  before insert on public.messages
  for each row execute function public.fill_message_sender_role();


-- ── 2. Owner RLS extensions ──────────────────────────────────────────────────
-- Existing policies restrict to thread participants. Add OR-clauses for
-- owners of the thread's studio.

drop policy if exists threads_select_owner on public.threads;
create policy threads_select_owner on public.threads
  for select using (public.my_role_in(studio_id) = 'owner');

drop policy if exists thread_participants_select_owner on public.thread_participants;
create policy thread_participants_select_owner on public.thread_participants
  for select using (
    exists (
      select 1
      from public.threads t
      where t.id = thread_participants.thread_id
        and public.my_role_in(t.studio_id) = 'owner'
    )
  );

drop policy if exists messages_select_owner on public.messages;
create policy messages_select_owner on public.messages
  for select using (
    exists (
      select 1
      from public.threads t
      where t.id = messages.thread_id
        and public.my_role_in(t.studio_id) = 'owner'
    )
  );

drop policy if exists messages_insert_owner on public.messages;
create policy messages_insert_owner on public.messages
  for insert with check (
    -- sender row belongs to me
    exists (
      select 1 from public.studio_members m
       where m.id = messages.sender_member_id and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.threads t
      where t.id = messages.thread_id
        and public.my_role_in(t.studio_id) = 'owner'
    )
  );


-- ── 3. studio_threads_overview RPC (owner inbox) ─────────────────────────────
-- One row per thread in the caller's owned studio. Returns both participants
-- (client + admin) + last message preview. Filter: 'all' | 'today' | 'unread'.
-- 'unread' = at least one participant has unread (last_message_at > their
-- last_read_at).

drop function if exists public.studio_threads_overview(text);

create or replace function public.studio_threads_overview(p_filter text default 'all')
returns table(
  thread_id              uuid,
  studio_id              uuid,
  client_member_id       uuid,
  client_name            text,
  client_hue             int,
  admin_member_id        uuid,
  admin_name             text,
  admin_hue              int,
  last_message_at        timestamptz,
  last_message_body      text,
  last_message_role      text,
  last_message_sender_id uuid,
  unread_any             boolean
)
language plpgsql stable security invoker
set search_path = public, pg_temp
as $$
begin
  return query
  with owned as (
    select s.id as studio_id
    from public.studios s
    join public.studio_members m
      on m.studio_id = s.id
     and m.user_id = auth.uid()
     and m.role = 'owner'
     and m.status = 'active'
  ),
  parts as (
    select
      t.id as thread_id,
      t.studio_id,
      t.last_message_at,
      max(case when sm.role = 'client' then sm.id end) as client_member_id,
      max(case when sm.role = 'client' then u.name end) as client_name,
      max(case when sm.role = 'client' then u.avatar_hue end) as client_hue,
      max(case when sm.role = 'client' then tp.last_read_at end) as client_last_read,
      max(case when sm.role = 'admin'  then sm.id end) as admin_member_id,
      max(case when sm.role = 'admin'  then u.name end) as admin_name,
      max(case when sm.role = 'admin'  then u.avatar_hue end) as admin_hue,
      max(case when sm.role = 'admin'  then tp.last_read_at end) as admin_last_read
    from public.threads t
    join owned o on o.studio_id = t.studio_id
    join public.thread_participants tp on tp.thread_id = t.id
    join public.studio_members sm on sm.id = tp.member_id
    left join public.users u on u.id = sm.user_id
    group by t.id, t.studio_id, t.last_message_at
  ),
  last_msgs as (
    select distinct on (m.thread_id)
      m.thread_id, m.body, m.sender_role, m.sender_member_id, m.created_at
    from public.messages m
    join parts p on p.thread_id = m.thread_id
    order by m.thread_id, m.created_at desc
  )
  select
    p.thread_id,
    p.studio_id,
    p.client_member_id,
    p.client_name,
    p.client_hue,
    p.admin_member_id,
    p.admin_name,
    p.admin_hue,
    p.last_message_at,
    lm.body              as last_message_body,
    lm.sender_role       as last_message_role,
    lm.sender_member_id  as last_message_sender_id,
    coalesce(
      p.last_message_at > coalesce(p.client_last_read, '-infinity')
      or p.last_message_at > coalesce(p.admin_last_read,  '-infinity'),
      false
    ) as unread_any
  from parts p
  left join last_msgs lm on lm.thread_id = p.thread_id
  where (p_filter = 'all')
     or (p_filter = 'today'  and p.last_message_at >= date_trunc('day', now()))
     or (p_filter = 'unread' and (
            p.last_message_at > coalesce(p.client_last_read, '-infinity')
         or p.last_message_at > coalesce(p.admin_last_read,  '-infinity')
       ))
  order by p.last_message_at desc nulls last;
end;
$$;

grant execute on function public.studio_threads_overview(text) to authenticated;


-- ── 4. Auto-post chat messages when bookings change ──────────────────────────
-- AFTER INSERT on bookings: post a 'booking_event' message in the admin↔client
-- 1-1 thread (creating the thread if it doesn't exist). Sender = the booking's
-- client_member_id; sender_role gets filled by the message trigger.
-- AFTER UPDATE OF status WHEN status='cancelled': post a cancellation event.
--
-- security definer so we can insert thread + participants + message regardless
-- of who triggered the booking.

create or replace function public.auto_chat_for_booking()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_session     public.sessions%rowtype;
  v_service     public.services%rowtype;
  v_studio_id   uuid;
  v_thread_id   uuid;
  v_body        text;
  v_local_time  text;
begin
  -- Cancellations: only react when status flips to 'cancelled'
  if tg_op = 'UPDATE'
     and (new.status <> 'cancelled' or old.status = 'cancelled')
  then
    return new;
  end if;

  -- Solo bookings only auto-post on INSERT or cancellation. For class
  -- bookings (mode='group') we also want both events; same path.
  select * into v_session from public.sessions where id = new.session_id;
  if not found then return new; end if;
  select * into v_service from public.services where id = v_session.service_id;
  if not found then return new; end if;

  v_studio_id := v_session.studio_id;

  -- Find or create the admin↔client thread.
  select t.id into v_thread_id
  from public.threads t
  where t.studio_id = v_studio_id
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = t.id and tp.member_id = new.client_member_id
    )
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = t.id and tp.member_id = v_session.admin_member_id
    )
    and (select count(*) from public.thread_participants where thread_id = t.id) = 2
  limit 1;

  if v_thread_id is null then
    insert into public.threads (studio_id) values (v_studio_id) returning id into v_thread_id;
    insert into public.thread_participants (thread_id, member_id) values
      (v_thread_id, new.client_member_id),
      (v_thread_id, v_session.admin_member_id);
  end if;

  -- Body — keep it short, the UI renders attached_booking_id as a card.
  v_local_time := to_char(v_session.starts_at at time zone 'UTC',
                          'FMDay FMMon DD at HH12:MI AM');

  if tg_op = 'INSERT' then
    v_body := '📅 Booked: ' || v_service.name || ' · ' || v_local_time;
  else
    v_body := '❌ Cancelled: ' || v_service.name || ' · ' || v_local_time;
  end if;

  insert into public.messages (
    thread_id, sender_member_id, body, kind, attached_booking_id
  ) values (
    v_thread_id,
    new.client_member_id,   -- attribute the event to the client side
    v_body,
    'booking_event',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists bookings_auto_chat_insert on public.bookings;
create trigger bookings_auto_chat_insert
  after insert on public.bookings
  for each row execute function public.auto_chat_for_booking();

drop trigger if exists bookings_auto_chat_cancel on public.bookings;
create trigger bookings_auto_chat_cancel
  after update of status on public.bookings
  for each row execute function public.auto_chat_for_booking();


-- ── 5. Update my_threads_overview to surface sender_role ─────────────────────
-- Return signature gains a column → must DROP before CREATE OR REPLACE.

drop function if exists public.my_threads_overview();

create or replace function public.my_threads_overview()
returns table(
  thread_id uuid,
  studio_id uuid,
  my_member_id uuid,
  other_member_id uuid,
  other_name text,
  other_hue int,
  last_message_at timestamptz,
  last_message_body text,
  last_message_sender_member_id uuid,
  last_message_sender_role text,
  unread_count bigint
)
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with me as (
    select m.id, m.user_id, m.studio_id
    from public.studio_members m
    where m.user_id = auth.uid() and m.status = 'active'
  ),
  my_threads as (
    select
      t.id              as thread_id,
      t.studio_id,
      t.last_message_at,
      tp.last_read_at,
      me.id             as my_member_id
    from public.threads t
    join public.thread_participants tp on tp.thread_id = t.id
    join me on me.id = tp.member_id
  )
  select
    mt.thread_id,
    mt.studio_id,
    mt.my_member_id,
    other_tp.member_id   as other_member_id,
    u.name               as other_name,
    u.avatar_hue         as other_hue,
    mt.last_message_at,
    lm.body              as last_message_body,
    lm.sender_member_id  as last_message_sender_member_id,
    lm.sender_role       as last_message_sender_role,
    (
      select count(*)::bigint
      from public.messages m
      where m.thread_id = mt.thread_id
        and m.created_at > mt.last_read_at
        and m.sender_member_id <> mt.my_member_id
    )                    as unread_count
  from my_threads mt
  left join lateral (
    select tp.member_id
    from public.thread_participants tp
    where tp.thread_id = mt.thread_id and tp.member_id <> mt.my_member_id
    order by tp.member_id
    limit 1
  ) other_tp on true
  left join public.studio_members om on om.id = other_tp.member_id
  left join public.users u on u.id = om.user_id
  left join lateral (
    select m.body, m.sender_member_id, m.sender_role, m.created_at
    from public.messages m
    where m.thread_id = mt.thread_id
    order by m.created_at desc
    limit 1
  ) lm on true
  order by mt.last_message_at desc nulls last
$$;

grant execute on function public.my_threads_overview() to authenticated;
