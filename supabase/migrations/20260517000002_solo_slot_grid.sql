-- =============================================================================
-- Book It Daily -- solo_slot_grid
--
-- Sibling to `free_solo_slots`, but returns EVERY candidate slot in the
-- studio's hours window with a status flag, so the booking UI can render
-- the full grid (greyed-out blocked slots, not just available ones).
--
-- Status values:
--   'available'    -> can be booked
--   'booked'       -> there is a non-cancelled session exactly at this time
--                     (the user can see their own bookings here)
--   'blocked'      -> overlaps a different session (or admin time-off /
--                     outside admin working hours, but still inside studio
--                     hours -- we group these as "unavailable")
--   'past'         -> the start time is already in the past
-- =============================================================================

create or replace function public.solo_slot_grid(
  p_service_id    uuid,
  p_date          date,
  p_step_minutes  int default 30
)
returns table(starts_at timestamptz, status text)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id       uuid := auth.uid();
  v_service       public.services%rowtype;
  v_weekday       int;
  v_studio_hours  public.studio_hours%rowtype;
  v_dur           interval;
  v_iter          timestamptz;
  v_end           timestamptz;
  v_blocked       boolean;
  v_in_window     boolean;
  v_overlap_session_starts_at timestamptz;
  v_status        text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_service from public.services
    where id = p_service_id and active = true;
  if not found then
    raise exception 'service_not_found' using errcode = 'P0001';
  end if;
  if v_service.mode <> 'solo' then
    raise exception 'not_a_solo_service' using errcode = 'P0001';
  end if;
  if v_service.admin_member_id is null then
    raise exception 'service_has_no_admin' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.studio_members
    where studio_id = v_service.studio_id
      and user_id = v_user_id
      and status = 'active'
  ) then
    raise exception 'not_a_member_of_studio' using errcode = '42501';
  end if;

  v_weekday := extract(dow from p_date)::int;
  select * into v_studio_hours
    from public.studio_hours
    where studio_id = v_service.studio_id and weekday = v_weekday;
  if not found or v_studio_hours.closed
     or v_studio_hours.open_time is null or v_studio_hours.close_time is null then
    return;
  end if;

  v_dur := make_interval(mins => v_service.duration_min);
  v_iter := (p_date::timestamp + v_studio_hours.open_time) at time zone 'UTC';
  v_end  := (p_date::timestamp + v_studio_hours.close_time) at time zone 'UTC';

  -- Whole-day admin block kills the whole row.
  select exists (
    select 1 from public.availability_exceptions
    where admin_member_id = v_service.admin_member_id
      and date = p_date
      and type = 'block'
      and start_time is null
      and end_time is null
  ) into v_blocked;
  if v_blocked then
    while v_iter + v_dur <= v_end loop
      return query select v_iter, 'blocked'::text;
      v_iter := v_iter + make_interval(mins => p_step_minutes);
    end loop;
    return;
  end if;

  while v_iter + v_dur <= v_end loop
    -- Default to blocked; promote to 'available'/'booked'/'past' as we learn more.
    v_status := 'blocked';

    -- (a) Inside admin's availability rules for this weekday?
    select exists (
      select 1 from public.availability_rules r
      where r.admin_member_id = v_service.admin_member_id
        and r.weekday = v_weekday
        and ((p_date::timestamp + r.start_time) at time zone 'UTC') <= v_iter
        and ((p_date::timestamp + r.end_time)   at time zone 'UTC') >= v_iter + v_dur
    ) into v_in_window;

    if v_in_window then
      -- (b) Partial-day block overlapping this slot?
      select exists (
        select 1 from public.availability_exceptions e
        where e.admin_member_id = v_service.admin_member_id
          and e.date = p_date
          and e.type = 'block'
          and e.start_time is not null and e.end_time is not null
          and tstzrange(
                (p_date::timestamp + e.start_time) at time zone 'UTC',
                (p_date::timestamp + e.end_time)   at time zone 'UTC'
              ) && tstzrange(v_iter, v_iter + v_dur)
      ) into v_blocked;

      if not v_blocked then
        -- (c) Any overlapping non-cancelled session for the same admin?
        --     Capture its starts_at so we can mark this slot 'booked' when
        --     it overlaps EXACTLY (i.e. this is the booked slot itself).
        select s.starts_at into v_overlap_session_starts_at
        from public.sessions s
        where s.admin_member_id = v_service.admin_member_id
          and s.status <> 'cancelled'
          and public.session_range(s.starts_at, s.duration_min)
              && tstzrange(v_iter, v_iter + v_dur)
        limit 1;

        if v_overlap_session_starts_at is null then
          v_status := 'available';
        elsif v_overlap_session_starts_at = v_iter then
          v_status := 'booked';
        else
          v_status := 'blocked';
        end if;
      end if;
    end if;

    -- Past-date check trumps everything else.
    if v_iter <= now() then
      v_status := 'past';
    end if;

    return query select v_iter, v_status;
    v_iter := v_iter + make_interval(mins => p_step_minutes);
  end loop;
end;
$$;

grant execute on function public.solo_slot_grid(uuid, date, int) to authenticated;
