-- =============================================================================
-- Book It Daily -- invitations system
--
-- Owner creates an invitation row -> shareable link with the token ->
-- recipient signs up with ?invite=TOKEN -> accept_invitation() RPC creates
-- a studio_members row and marks the invitation accepted.
--
-- The token itself is the credential. Anyone holding it can accept once.
-- =============================================================================

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references public.studios(id) on delete cascade,
  email        citext not null,
  role         text not null check (role in ('admin','client')),
  -- 32-hex-char token from gen_random_uuid (128 bits). Built-in, no schema prefix needed.
  token        text not null unique default replace(gen_random_uuid()::text, '-', ''),
  expires_at   timestamptz not null default now() + interval '7 days',
  invited_by   uuid not null references public.users(id),
  accepted_at  timestamptz,
  accepted_by  uuid references public.users(id),
  cancelled_at timestamptz,
  created_at   timestamptz not null default now()
);
create index invitations_studio_pending_idx
  on public.invitations (studio_id)
  where accepted_at is null and cancelled_at is null;
create index invitations_email_idx on public.invitations (email);


-- RLS: only studio owners read / create / cancel.
alter table public.invitations enable row level security;

create policy invitations_owner_select on public.invitations
  for select using (public.my_role_in(studio_id) = 'owner');

create policy invitations_owner_insert on public.invitations
  for insert with check (public.my_role_in(studio_id) = 'owner');

create policy invitations_owner_update on public.invitations
  for update using (public.my_role_in(studio_id) = 'owner')
  with check (public.my_role_in(studio_id) = 'owner');


-- Helper: look up an invitation by token without exposing the full row to
-- unauthenticated users. Returns minimal preview info; security definer.
create or replace function public.peek_invitation(p_token text)
returns table(
  studio_id    uuid,
  studio_name  text,
  studio_slug  text,
  email        citext,
  role         text,
  expires_at   timestamptz,
  accepted_at  timestamptz,
  cancelled_at timestamptz
)
language sql security definer
set search_path = public, pg_temp
as $$
  select s.id, s.name, s.slug, i.email, i.role, i.expires_at, i.accepted_at, i.cancelled_at
  from public.invitations i
  join public.studios s on s.id = i.studio_id
  where i.token = p_token
  limit 1
$$;

grant execute on function public.peek_invitation(text) to anon, authenticated;


-- RPC: accept_invitation -- called after a user has authenticated.
-- Idempotent: if the caller is already an active member of the studio for
-- this role, returns the existing membership.
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id    uuid := auth.uid();
  v_invite     public.invitations%rowtype;
  v_existing   uuid;
  v_member_id  uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invite from public.invitations where token = p_token;
  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;
  if v_invite.cancelled_at is not null then
    raise exception 'invitation_cancelled' using errcode = 'P0001';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;
  if v_invite.accepted_at is not null and v_invite.accepted_by <> v_user_id then
    raise exception 'invitation_already_used' using errcode = 'P0001';
  end if;

  -- Already a member? Just return.
  select id into v_existing
  from public.studio_members
  where studio_id = v_invite.studio_id
    and user_id = v_user_id
    and status = 'active';
  if v_existing is not null then
    update public.invitations
      set accepted_at = coalesce(accepted_at, now()), accepted_by = v_user_id
      where id = v_invite.id;
    return v_existing;
  end if;

  -- Create the membership.
  insert into public.studio_members (studio_id, user_id, role, status, invited_by)
  values (v_invite.studio_id, v_user_id, v_invite.role, 'active', v_invite.invited_by)
  returning id into v_member_id;

  update public.invitations
    set accepted_at = now(), accepted_by = v_user_id
    where id = v_invite.id;

  return v_member_id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;


-- RPC: cancel_invitation -- owner-only.
create or replace function public.cancel_invitation(p_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_studio uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select studio_id into v_studio from public.invitations where id = p_id;
  if v_studio is null then return; end if;
  if public.my_role_in(v_studio) <> 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.invitations
    set cancelled_at = now()
    where id = p_id and accepted_at is null;
end;
$$;

grant execute on function public.cancel_invitation(uuid) to authenticated;
