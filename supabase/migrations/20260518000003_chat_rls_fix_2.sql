-- =============================================================================
-- Fix 2 for chat RLS + studio_threads_overview
--
-- 1. The base `thread_participants_select` queries `thread_participants` from
--    inside itself. That self-recursive policy was tolerated by Postgres
--    until additional cross-table policies tipped it over the cycle
--    detector → "infinite recursion detected" for ALL roles. Rewrite all
--    chat policies to route the participation check through a security
--    definer helper so RLS doesn't recurse.
--
-- 2. `studio_threads_overview` used `max(uuid)` to collapse the two
--    participants of each thread into one row → Postgres has no
--    `max(uuid)` aggregate. Rewrite with LATERAL subqueries.
-- =============================================================================


-- ── 1. Security-definer helper: is_thread_participant ───────────────────────
create or replace function public.is_thread_participant(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.thread_participants tp
    join public.studio_members m on m.id = tp.member_id
    where tp.thread_id = p_thread and m.user_id = auth.uid()
  )
$$;

grant execute on function public.is_thread_participant(uuid) to authenticated, anon;


-- ── 2. Rebuild chat RLS without table-self-recursion ────────────────────────

-- threads
drop policy if exists threads_select on public.threads;
create policy threads_select on public.threads
  for select using (public.is_thread_participant(threads.id));

-- thread_participants
drop policy if exists thread_participants_select on public.thread_participants;
create policy thread_participants_select on public.thread_participants
  for select using (
    -- my own membership row, OR I'm a participant of this thread
    exists (
      select 1 from public.studio_members m
       where m.id = thread_participants.member_id and m.user_id = auth.uid()
    )
    or public.is_thread_participant(thread_participants.thread_id)
  );

drop policy if exists thread_participants_insert on public.thread_participants;
create policy thread_participants_insert on public.thread_participants
  for insert with check (
    -- creating my own participant row
    exists (
      select 1 from public.studio_members m
       where m.id = thread_participants.member_id and m.user_id = auth.uid()
    )
    -- or I'm already in this thread (owner adding someone, etc.)
    or public.is_thread_participant(thread_participants.thread_id)
  );

-- messages
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (public.is_thread_participant(messages.thread_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    -- sender row belongs to me
    exists (
      select 1 from public.studio_members m
       where m.id = messages.sender_member_id and m.user_id = auth.uid()
    )
    -- and I'm a participant
    and public.is_thread_participant(messages.thread_id)
  );


-- ── 3. studio_threads_overview without max(uuid) ────────────────────────────

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
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with owned as (
    select s.id as sid
    from public.studios s
    join public.studio_members m
      on m.studio_id = s.id
     and m.user_id = auth.uid()
     and m.role = 'owner'
     and m.status = 'active'
  ),
  ths as (
    select t.id as thread_id, t.studio_id, t.last_message_at
    from public.threads t
    join owned o on o.sid = t.studio_id
  )
  select
    ths.thread_id,
    ths.studio_id,
    cli.member_id as client_member_id,
    cli.name      as client_name,
    cli.hue       as client_hue,
    adm.member_id as admin_member_id,
    adm.name      as admin_name,
    adm.hue       as admin_hue,
    ths.last_message_at,
    lm.body                as last_message_body,
    lm.sender_role         as last_message_role,
    lm.sender_member_id    as last_message_sender_id,
    coalesce(
      ths.last_message_at > coalesce(cli.last_read_at, '-infinity'::timestamptz)
      or ths.last_message_at > coalesce(adm.last_read_at, '-infinity'::timestamptz),
      false
    ) as unread_any
  from ths
  left join lateral (
    select sm.id as member_id, u.name, u.avatar_hue as hue, tp.last_read_at
    from public.thread_participants tp
    join public.studio_members sm on sm.id = tp.member_id
    left join public.users u on u.id = sm.user_id
    where tp.thread_id = ths.thread_id and sm.role = 'client'
    limit 1
  ) cli on true
  left join lateral (
    select sm.id as member_id, u.name, u.avatar_hue as hue, tp.last_read_at
    from public.thread_participants tp
    join public.studio_members sm on sm.id = tp.member_id
    left join public.users u on u.id = sm.user_id
    where tp.thread_id = ths.thread_id and sm.role = 'admin'
    limit 1
  ) adm on true
  left join lateral (
    select m.body, m.sender_role, m.sender_member_id, m.created_at
    from public.messages m
    where m.thread_id = ths.thread_id
    order by m.created_at desc
    limit 1
  ) lm on true
  where (p_filter = 'all')
     or (p_filter = 'today'  and ths.last_message_at >= date_trunc('day', now()))
     or (p_filter = 'unread' and (
            ths.last_message_at > coalesce(cli.last_read_at, '-infinity'::timestamptz)
         or ths.last_message_at > coalesce(adm.last_read_at, '-infinity'::timestamptz)
       ))
  order by ths.last_message_at desc nulls last
$$;

grant execute on function public.studio_threads_overview(text) to authenticated;
