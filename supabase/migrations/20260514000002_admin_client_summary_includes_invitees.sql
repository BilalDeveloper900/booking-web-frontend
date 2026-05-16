-- =============================================================================
-- admin_client_summary v2 -- show invited clients before their first booking.
--
-- v1 keyed (admin, client) pairs off of bookings only, so a newly-signed-up
-- client invited by an admin was invisible until they booked.
--
-- v2 unions two pair sources:
--   (a) pair_by_booking -- distinct clients in this admin's sessions
--   (b) pair_by_invite  -- clients whose studio_members.invited_by is this admin
--
-- Stats (visits / last / next / credits / favourite_service) still come only
-- from bookings, so invite-only rows just show zero/empty values.
-- =============================================================================

create or replace view public.admin_client_summary
with (security_invoker = true)
as
with admin_members as (
  select id as admin_member_id, user_id as admin_user_id, studio_id
  from public.studio_members
  where role = 'admin' and status = 'active'
),
client_members as (
  select id as client_member_id, studio_id, invited_by
  from public.studio_members
  where role = 'client' and status = 'active'
),
admin_bookings as (
  -- All bookings on sessions owned by an admin. Used both to enumerate
  -- pairs (a) and to compute stats.
  select
    s.admin_member_id,
    s.studio_id,
    b.client_member_id,
    b.status,
    b.credits_charged,
    s.starts_at,
    s.service_id
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.status in ('confirmed','attended','no_show','pending')
),
pair_by_booking as (
  select distinct admin_member_id, client_member_id, studio_id
  from admin_bookings
),
pair_by_invite as (
  select a.admin_member_id, c.client_member_id, a.studio_id
  from admin_members a
  join client_members c
    on c.studio_id = a.studio_id
   and c.invited_by = a.admin_user_id
),
pairs as (
  select * from pair_by_booking
  union
  select * from pair_by_invite
),
aggregated as (
  select
    p.admin_member_id,
    p.client_member_id,
    p.studio_id,
    count(*) filter (
      where ab.status in ('attended','confirmed') and ab.starts_at < now()
    ) as visits,
    max(ab.starts_at) filter (
      where ab.status in ('attended','confirmed') and ab.starts_at < now()
    ) as last_visit_at,
    min(ab.starts_at) filter (
      where ab.status = 'confirmed' and ab.starts_at > now()
    ) as next_visit_at,
    coalesce(sum(ab.credits_charged) filter (
      where ab.status in ('attended','confirmed')
    ), 0) as total_credits_charged
  from pairs p
  left join admin_bookings ab
    on ab.admin_member_id = p.admin_member_id
   and ab.client_member_id = p.client_member_id
  group by p.admin_member_id, p.client_member_id, p.studio_id
),
fav as (
  select distinct on (admin_member_id, client_member_id)
    admin_member_id, client_member_id, service_id
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
