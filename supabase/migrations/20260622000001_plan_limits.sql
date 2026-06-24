-- =============================================================================
-- Book It Daily — plan limit enforcement
--
-- The public pricing page advertises per-plan caps:
--   Free   — 1 admin seat,  30 active clients,  50 bookings / month
--   Solo   — 1 admin seat, 150 active clients,  unlimited bookings
--   Studio — 5 admin seats, 500 active clients, unlimited bookings
--
-- Until now these were marketing copy only — nothing stopped a Free studio from
-- inviting 20 admins or taking 10,000 bookings. That removes any reason to
-- upgrade. This migration enforces the caps in the DATABASE (not the app) so
-- they hold no matter which code path or client makes the write:
--
--   * studio_members INSERT  → admin-seat / active-client caps
--   * invitations    INSERT  → same caps, checked at invite time (active members
--                              + still-pending invites) so owners are told before
--                              they send the email
--   * bookings       INSERT  → monthly booking cap (Free only; paid = unlimited)
--
-- All limit violations raise SQLSTATE 'P0001' with HINT 'upgrade_required' and a
-- DETAIL token (admins | clients | bookings) so the app can show a friendly
-- "upgrade to add more" message. NULL limit = unlimited.
--
-- Enforcement is INSERT-only for v1: reactivating a suspended member via UPDATE
-- is not re-checked (rare; acceptable for launch).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- effective_plan — the plan whose limits actually apply to a studio.
-- Falls back to 'free' when there is no subscription row or the subscription has
-- churned (cancelled / expired), so a lapsed Studio studio doesn't keep Studio
-- limits forever. trialing / active / past_due all keep their plan's limits.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.effective_plan(p_studio_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
           when s.plan is null then 'free'
           when s.status in ('cancelled', 'expired') then 'free'
           else s.plan
         end
  from public.studio_subscriptions s
  where s.studio_id = p_studio_id
  union all
  select 'free'
  where not exists (
    select 1 from public.studio_subscriptions s2 where s2.studio_id = p_studio_id
  )
  limit 1
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- plan limit lookups. NULL = unlimited. Single source of truth for the caps;
-- the app mirrors these numbers in lib/limits.ts for display only.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.plan_max_admins(p_plan text)
returns int language sql immutable as $$
  select case p_plan
           when 'free'   then 1
           when 'solo'   then 1
           when 'studio' then 5
           else null            -- atelier / unknown → unlimited
         end
$$;

create or replace function public.plan_max_clients(p_plan text)
returns int language sql immutable as $$
  select case p_plan
           when 'free'   then 30
           when 'solo'   then 150
           when 'studio' then 500
           else null
         end
$$;

create or replace function public.plan_max_bookings_per_month(p_plan text)
returns int language sql immutable as $$
  select case p_plan
           when 'free' then 50
           else null            -- every paid plan = unlimited bookings
         end
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Member cap — fires on INSERT into studio_members. Owners are never capped.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan    text;
  v_limit   int;
  v_count   int;
begin
  -- Only active admin/client memberships count against caps.
  if new.role = 'owner' or new.status <> 'active' then
    return new;
  end if;

  v_plan := public.effective_plan(new.studio_id);

  if new.role = 'admin' then
    v_limit := public.plan_max_admins(v_plan);
  else
    v_limit := public.plan_max_clients(v_plan);
  end if;

  if v_limit is null then
    return new; -- unlimited
  end if;

  select count(*) into v_count
  from public.studio_members
  where studio_id = new.studio_id
    and role = new.role
    and status = 'active';

  if v_count + 1 > v_limit then
    raise exception 'plan_limit_reached'
      using errcode = 'P0001',
            hint    = 'upgrade_required',
            detail  = case when new.role = 'admin' then 'admins' else 'clients' end,
            message = case
              when new.role = 'admin'
                then format('Your plan includes %s admin seat(s). Upgrade to add more.', v_limit)
              else format('Your plan includes up to %s active clients. Upgrade to add more.', v_limit)
            end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_member_limit on public.studio_members;
create trigger trg_enforce_member_limit
  before insert on public.studio_members
  for each row execute function public.enforce_member_limit();


-- ─────────────────────────────────────────────────────────────────────────────
-- Invitation cap — fires on INSERT into invitations. Blocks creating an invite
-- that, if accepted, would exceed the cap. Counts active members of the role
-- PLUS still-pending invites of the role, so a Free studio (1 admin) can't queue
-- up 5 admin invites and email them before the cap bites at accept time.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_invitation_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan      text;
  v_limit     int;
  v_active    int;
  v_pending   int;
begin
  v_plan := public.effective_plan(new.studio_id);

  if new.role = 'admin' then
    v_limit := public.plan_max_admins(v_plan);
  else
    v_limit := public.plan_max_clients(v_plan);
  end if;

  if v_limit is null then
    return new; -- unlimited
  end if;

  select count(*) into v_active
  from public.studio_members
  where studio_id = new.studio_id
    and role = new.role
    and status = 'active';

  select count(*) into v_pending
  from public.invitations
  where studio_id = new.studio_id
    and role = new.role
    and accepted_at is null
    and cancelled_at is null
    and expires_at > now();

  if v_active + v_pending + 1 > v_limit then
    raise exception 'plan_limit_reached'
      using errcode = 'P0001',
            hint    = 'upgrade_required',
            detail  = case when new.role = 'admin' then 'admins' else 'clients' end,
            message = case
              when new.role = 'admin'
                then format('Your plan includes %s admin seat(s), and you''ve used them all (including pending invites). Upgrade to invite more.', v_limit)
              else format('Your plan includes up to %s active clients, and you''ve reached the cap (including pending invites). Upgrade to invite more.', v_limit)
            end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_invitation_limit on public.invitations;
create trigger trg_enforce_invitation_limit
  before insert on public.invitations
  for each row execute function public.enforce_invitation_limit();


-- ─────────────────────────────────────────────────────────────────────────────
-- Monthly booking cap — fires on INSERT into bookings. Counts non-cancelled
-- bookings made in the current UTC month for the studio (resolved via the
-- booking's session). Only Free is capped; paid plans return NULL (unlimited).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_booking_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_studio  uuid;
  v_plan    text;
  v_limit   int;
  v_count   int;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  select studio_id into v_studio from public.sessions where id = new.session_id;
  if v_studio is null then
    return new; -- session missing; let the FK constraint handle it
  end if;

  v_plan  := public.effective_plan(v_studio);
  v_limit := public.plan_max_bookings_per_month(v_plan);

  if v_limit is null then
    return new; -- unlimited
  end if;

  -- Start of the current UTC month as a timestamptz, independent of the
  -- session's TimeZone setting.
  select count(*) into v_count
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where s.studio_id = v_studio
    and b.status <> 'cancelled'
    and b.booked_at >= (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC');

  if v_count + 1 > v_limit then
    raise exception 'plan_limit_reached'
      using errcode = 'P0001',
            hint    = 'upgrade_required',
            detail  = 'bookings',
            message = format('Your plan includes %s bookings per month. Upgrade for unlimited bookings.', v_limit);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_booking_limit on public.bookings;
-- Order matters only loosely; run after capacity so "full" wins over "cap" when
-- both apply. Trigger names fire alphabetically: capacity trigger is named in
-- init.sql; this one sorts later, which is fine.
create trigger trg_enforce_booking_limit
  before insert on public.bookings
  for each row execute function public.enforce_booking_limit();
