-- =============================================================================
-- Book It Daily -- default availability seeding
--
-- Bug fix: New studios had no `studio_hours` rows, so `free_solo_slots`
-- returned empty for every date. New admins (via invitation) had no
-- `availability_rules`, so even with studio_hours set, no slots showed.
--
-- This migration:
--   1. Backfills missing studio_hours for existing studios (Mon-Sat 9-18,
--      Sun closed).
--   2. Backfills missing availability_rules for existing admin members
--      (Mon-Sat 9-18).
--   3. Updates `create_studio_for_owner` to seed studio_hours.
--   4. Updates `accept_invitation` to seed availability_rules for admins.
-- =============================================================================


-- ── 1. Backfill studio_hours ───────────────────────────────────────────────
insert into public.studio_hours (studio_id, weekday, open_time, close_time, closed)
select s.id, wd.weekday, wd.open_time, wd.close_time, wd.closed
from public.studios s
cross join (values
  (0, null::time, null::time, true),     -- Sunday closed
  (1, '09:00'::time, '18:00'::time, false),
  (2, '09:00'::time, '18:00'::time, false),
  (3, '09:00'::time, '18:00'::time, false),
  (4, '09:00'::time, '18:00'::time, false),
  (5, '09:00'::time, '18:00'::time, false),
  (6, '09:00'::time, '18:00'::time, false)
) as wd(weekday, open_time, close_time, closed)
where not exists (
  select 1 from public.studio_hours sh
  where sh.studio_id = s.id and sh.weekday = wd.weekday
);


-- ── 2. Backfill availability_rules for existing admins ────────────────────
insert into public.availability_rules (studio_id, admin_member_id, weekday, start_time, end_time)
select m.studio_id, m.id, wd.weekday, wd.start_time, wd.end_time
from public.studio_members m
cross join (values
  (1, '09:00'::time, '18:00'::time),     -- Mon-Sat 9-18
  (2, '09:00'::time, '18:00'::time),
  (3, '09:00'::time, '18:00'::time),
  (4, '09:00'::time, '18:00'::time),
  (5, '09:00'::time, '18:00'::time),
  (6, '09:00'::time, '18:00'::time)
) as wd(weekday, start_time, end_time)
where m.role = 'admin'
  and m.status = 'active'
  and not exists (
    select 1 from public.availability_rules r
    where r.admin_member_id = m.id
  );


-- ── 3. Update create_studio_for_owner to seed studio_hours ────────────────
create or replace function public.create_studio_for_owner(
  p_studio_name text default null
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id   uuid := auth.uid();
  v_studio_id uuid;
  v_existing  uuid;
  v_name      text;
  v_user_name text;
  v_slug      text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Idempotency: if this user already owns an active studio, just return it.
  select sm.studio_id into v_existing
  from public.studio_members sm
  where sm.user_id = v_user_id
    and sm.role = 'owner'
    and sm.status = 'active'
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  if p_studio_name is null or btrim(p_studio_name) = '' then
    select name into v_user_name from public.users where id = v_user_id;
    v_name := coalesce(v_user_name, 'My') || '''s Studio';
  else
    v_name := btrim(p_studio_name);
  end if;

  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(md5(random()::text), 1, 6);
  v_slug := btrim(v_slug, '-');

  insert into public.studios (name, slug, owner_id)
  values (v_name, v_slug, v_user_id)
  returning id into v_studio_id;

  insert into public.studio_members (studio_id, user_id, role, status)
  values (v_studio_id, v_user_id, 'owner', 'active');

  insert into public.studio_subscriptions (studio_id, plan, status, trial_ends_at)
  values (v_studio_id, 'free', 'trialing', now() + interval '14 days');

  -- Seed default studio hours: Mon-Sat 9-18, Sun closed.
  -- Without this, free_solo_slots returns empty for every date.
  insert into public.studio_hours (studio_id, weekday, open_time, close_time, closed) values
    (v_studio_id, 0, null, null, true),
    (v_studio_id, 1, '09:00', '18:00', false),
    (v_studio_id, 2, '09:00', '18:00', false),
    (v_studio_id, 3, '09:00', '18:00', false),
    (v_studio_id, 4, '09:00', '18:00', false),
    (v_studio_id, 5, '09:00', '18:00', false),
    (v_studio_id, 6, '09:00', '18:00', false);

  return v_studio_id;
end;
$$;


-- ── 4. Update accept_invitation to seed availability_rules for admins ─────
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

  insert into public.studio_members (studio_id, user_id, role, status, invited_by)
  values (v_invite.studio_id, v_user_id, v_invite.role, 'active', v_invite.invited_by)
  returning id into v_member_id;

  -- Seed default availability for new admins so clients can book immediately.
  -- Mon-Sat 9-18. Admin can override in /admin/settings.
  if v_invite.role = 'admin' then
    insert into public.availability_rules (studio_id, admin_member_id, weekday, start_time, end_time) values
      (v_invite.studio_id, v_member_id, 1, '09:00', '18:00'),
      (v_invite.studio_id, v_member_id, 2, '09:00', '18:00'),
      (v_invite.studio_id, v_member_id, 3, '09:00', '18:00'),
      (v_invite.studio_id, v_member_id, 4, '09:00', '18:00'),
      (v_invite.studio_id, v_member_id, 5, '09:00', '18:00'),
      (v_invite.studio_id, v_member_id, 6, '09:00', '18:00');
  end if;

  update public.invitations
    set accepted_at = now(), accepted_by = v_user_id
    where id = v_invite.id;

  return v_member_id;
end;
$$;
