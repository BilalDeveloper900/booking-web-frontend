-- =============================================================================
-- Admins can invite clients
--
-- Until now, only owners could create / read / cancel invitations. This
-- migration lets admins do the same for `role='client'` invites THEY created
-- (invited_by = the admin's auth.uid()).
--
-- Admins still cannot:
--   - Create admin invitations (owner-only)
--   - See or cancel invites created by someone else
--
-- The cancel_invitation RPC is updated to allow admins to cancel their own.
-- =============================================================================


-- ─── Read ───
create policy invitations_admin_select_own on public.invitations
  for select using (
    role = 'client'
    and invited_by = auth.uid()
    and public.my_role_in(studio_id) = 'admin'
  );


-- ─── Insert ───
create policy invitations_admin_insert_client on public.invitations
  for insert with check (
    role = 'client'
    and invited_by = auth.uid()
    and public.my_role_in(studio_id) = 'admin'
  );


-- ─── Update (used only for the soft-cancel path) ───
create policy invitations_admin_update_own on public.invitations
  for update using (
    role = 'client'
    and invited_by = auth.uid()
    and public.my_role_in(studio_id) = 'admin'
  )
  with check (
    role = 'client'
    and invited_by = auth.uid()
    and public.my_role_in(studio_id) = 'admin'
  );


-- ─── cancel_invitation: allow admins to cancel client invites they sent ───
create or replace function public.cancel_invitation(p_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.invitations%rowtype;
  v_role   text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invite from public.invitations where id = p_id;
  if v_invite.id is null then
    return; -- idempotent no-op
  end if;

  v_role := public.my_role_in(v_invite.studio_id);

  -- Owner: anything. Admin: client invites they sent.
  if not (
    v_role = 'owner'
    or (
      v_role = 'admin'
      and v_invite.role = 'client'
      and v_invite.invited_by = auth.uid()
    )
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.invitations
    set cancelled_at = now()
    where id = p_id and accepted_at is null;
end;
$$;
