-- ─────────────────────────────────────────────────────────────────────────────
-- admin_client_summary — per (admin, client) aggregate for /admin/clients
--
-- One row per distinct client who has ever booked a session with this admin.
-- The caller filters by `admin_member_id`; RLS on the underlying tables
-- (security_invoker view) guarantees the admin can only see their own data.
--
-- Columns deliberately NOT exposed:
--   - client_credits.balance   (RLS allows only self+owner; widening would
--                               leak credit balances to all admins. Revisit
--                               if studios want it.)
--   - lifetime €               (no per-booking price snapshot yet; tracked
--                               in BACKEND-PLAN.md Phase 4)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.admin_client_summary
with (security_invoker = true)
as
with admin_bookings as (
  select
    s.studio_id,
    s.admin_member_id,
    b.client_member_id,
    b.status,
    b.credits_charged,
    s.starts_at,
    s.service_id,
    s.duration_min
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.status in ('confirmed','attended','no_show','pending')
),
aggregated as (
  select
    admin_member_id,
    client_member_id,
    studio_id,
    count(*) filter (
      where status in ('attended','confirmed') and starts_at < now()
    ) as visits,
    max(starts_at) filter (
      where status in ('attended','confirmed') and starts_at < now()
    ) as last_visit_at,
    min(starts_at) filter (
      where status = 'confirmed' and starts_at > now()
    ) as next_visit_at,
    coalesce(sum(credits_charged) filter (
      where status in ('attended','confirmed')
    ), 0) as total_credits_charged
  from admin_bookings
  group by admin_member_id, client_member_id, studio_id
),
fav as (
  -- Service most frequently booked by this client with this admin.
  -- Ties broken by service_id for determinism.
  select distinct on (admin_member_id, client_member_id)
    admin_member_id,
    client_member_id,
    service_id
  from (
    select
      admin_member_id,
      client_member_id,
      service_id,
      count(*) as bookings
    from admin_bookings
    group by admin_member_id, client_member_id, service_id
  ) ranked
  order by admin_member_id, client_member_id, bookings desc, service_id
)
select
  a.admin_member_id,
  a.client_member_id,
  a.studio_id,
  u.name as client_name,
  u.avatar_hue as client_hue,
  a.visits,
  a.last_visit_at,
  a.next_visit_at,
  a.total_credits_charged,
  sv.name as favourite_service,
  sv.hue as favourite_service_hue
from aggregated a
join public.studio_members m on m.id = a.client_member_id
join public.users u on u.id = m.user_id
left join fav on fav.admin_member_id = a.admin_member_id
            and fav.client_member_id = a.client_member_id
left join public.services sv on sv.id = fav.service_id;

comment on view public.admin_client_summary is
  'Per-admin aggregate of distinct clients with visit + favourite-service stats. security_invoker — RLS via underlying tables.';
