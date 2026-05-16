-- =============================================================================
-- Real chat — RPCs + Realtime
--
-- Schema (threads / thread_participants / messages) is already in place. This
-- migration adds:
--   1. start_thread(p_other_member_id)     — find-or-create 1-1 thread
--   2. my_threads_overview()                — enriched list for the inbox view
--   3. Realtime publication for messages + threads
--
-- Assumes 1-1 threads in the UI; the schema technically supports group
-- threads but UI/RPCs treat each as a pair (caller + one other).
-- =============================================================================


-- ─── start_thread ─────────────────────────────────────────────────────────────
-- Finds an existing 1-1 thread between the caller and another member of the
-- same studio, or creates one. Idempotent.
--
-- security definer so we can bypass thread_participants_insert (which gates on
-- "you must already be a participant" for the second row).
create or replace function public.start_thread(p_other_member_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user      uuid := auth.uid();
  v_studio    uuid;
  v_my_member uuid;
  v_thread    uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select studio_id into v_studio
  from public.studio_members
  where id = p_other_member_id and status = 'active';
  if v_studio is null then
    raise exception 'other_member_not_found' using errcode = 'P0001';
  end if;

  select id into v_my_member
  from public.studio_members
  where user_id = v_user and studio_id = v_studio and status = 'active';
  if v_my_member is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_my_member = p_other_member_id then
    raise exception 'cannot_message_self' using errcode = 'P0001';
  end if;

  -- Existing 1-1 thread? (exactly two participants, exactly these two)
  select t.id into v_thread
  from public.threads t
  where t.studio_id = v_studio
    and exists (
      select 1 from public.thread_participants
      where thread_id = t.id and member_id = v_my_member
    )
    and exists (
      select 1 from public.thread_participants
      where thread_id = t.id and member_id = p_other_member_id
    )
    and (select count(*) from public.thread_participants where thread_id = t.id) = 2
  limit 1;

  if v_thread is not null then
    return v_thread;
  end if;

  insert into public.threads (studio_id) values (v_studio) returning id into v_thread;
  insert into public.thread_participants (thread_id, member_id)
    values (v_thread, v_my_member), (v_thread, p_other_member_id);
  return v_thread;
end;
$$;

grant execute on function public.start_thread(uuid) to authenticated;


-- ─── my_threads_overview ──────────────────────────────────────────────────────
-- One row per thread I'm in: other party, last message, unread count.
-- security invoker so RLS on the underlying tables applies. Caller must be
-- authenticated.
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
    select m.body, m.sender_member_id, m.created_at
    from public.messages m
    where m.thread_id = mt.thread_id
    order by m.created_at desc
    limit 1
  ) lm on true
  order by mt.last_message_at desc nulls last
$$;

grant execute on function public.my_threads_overview() to authenticated;


-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable INSERT/UPDATE replication on messages so clients can subscribe to
-- thread events. threads bumps its last_message_at via trigger, so subscribing
-- to threads gives us thread-list reordering for free.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.threads;
