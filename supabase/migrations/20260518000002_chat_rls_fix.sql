-- =============================================================================
-- Fix: infinite recursion in chat RLS policies
--
-- The owner-scope policies I added in 20260518000001 cross-join `threads`
-- from inside policies on `thread_participants` / `messages`. That triggers
-- threads_select RLS, which itself joins back to thread_participants — and
-- Postgres surfaces it as "infinite recursion detected in policy for
-- relation thread_participants".
--
-- Fix: route those owner-scope checks through a `security definer` helper
-- that fetches a thread's studio_id WITHOUT going through RLS.
-- =============================================================================


create or replace function public.thread_studio_id(p_thread uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select studio_id from public.threads where id = p_thread
$$;

grant execute on function public.thread_studio_id(uuid) to authenticated, anon;


-- ── Rebuild owner-scope policies without recursive table joins ───────────────

drop policy if exists thread_participants_select_owner on public.thread_participants;
create policy thread_participants_select_owner on public.thread_participants
  for select using (
    public.my_role_in(
      public.thread_studio_id(thread_participants.thread_id)
    ) = 'owner'
  );

drop policy if exists messages_select_owner on public.messages;
create policy messages_select_owner on public.messages
  for select using (
    public.my_role_in(
      public.thread_studio_id(messages.thread_id)
    ) = 'owner'
  );

drop policy if exists messages_insert_owner on public.messages;
create policy messages_insert_owner on public.messages
  for insert with check (
    exists (
      select 1 from public.studio_members m
       where m.id = messages.sender_member_id and m.user_id = auth.uid()
    )
    and public.my_role_in(
      public.thread_studio_id(messages.thread_id)
    ) = 'owner'
  );
