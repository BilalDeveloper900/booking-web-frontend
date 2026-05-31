-- =============================================================================
-- Book It Daily — booking timezone fix
--
-- Bug: solo_slot_grid + free_solo_slots interpreted studio_hours /
-- availability_rules / availability_exceptions wall-clock `time` values as
-- **UTC** (`at time zone 'UTC'`), ignoring the studio's configured timezone.
-- For a studio in Asia/Karachi (UTC+5) this shifted every slot +5h — 9 AM
-- studio hours surfaced as 2 PM slots.
--
-- Fix: read `studios.timezone` and interpret those wall-clock times in the
-- studio's timezone, so a 09:00 open really means 09:00 in the studio's locale.
-- `book_solo` is unchanged — it receives an absolute timestamptz, not a
-- wall-clock value, so it was never affected.
-- =============================================================================

create or replace function public.solo_slot_grid(
  p_service_id    uuid,
  p_date          date,
  p_step_minutes  int default 30
)
returns table(slot_at timestamptz, slot_status text)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id       uuid := auth.uid();
  v_service       public.services%rowtype;
  v_tz            text;
  v_weekday       int;
  v_studio_hours  public.studio_hours%rowtype;
  v_dur           interval;
  v_iter          timestamptz;
  v_end           timestamptz;
  v_blocked       boolean;
  v_in_window     boolean;
  v_overlap_at    timestamptz;
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

  -- Interpret wall-clock hours in the studio's timezone (defaults to UTC).
  select coalesce(timezone, 'UTC') into v_tz
    from public.studios where id = v_service.studio_id;
  v_tz := coalesce(v_tz, 'UTC');

  v_weekday := extract(dow from p_date)::int;
  select * into v_studio_hours
    from public.studio_hours
    where studio_id = v_service.studio_id and weekday = v_weekday;
  if not found or v_studio_hours.closed
     or v_studio_hours.open_time is null or v_studio_hours.close_time is null then
    return;
  end if;

  v_dur := make_interval(mins => v_service.duration_min);
  v_iter := (p_date::timestamp + v_studio_hours.open_time) at time zone v_tz;
  v_end  := (p_date::timestamp + v_studio_hours.close_time) at time zone v_tz;

  -- Whole-day admin block → emit every step as 'blocked' for visibility.
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
      slot_at := v_iter;
      slot_status := 'blocked';
      return next;
      v_iter := v_iter + make_interval(mins => p_step_minutes);
    end loop;
    return;
  end if;

  while v_iter + v_dur <= v_end loop
    v_status := 'blocked';

    select exists (
      select 1 from public.availability_rules r
      where r.admin_member_id = v_service.admin_member_id
        and r.weekday = v_weekday
        and ((p_date::timestamp + r.start_time) at time zone v_tz) <= v_iter
        and ((p_date::timestamp + r.end_time)   at time zone v_tz) >= v_iter + v_dur
    ) into v_in_window;

    if v_in_window then
      select exists (
        select 1 from public.availability_exceptions e
        where e.admin_member_id = v_service.admin_member_id
          and e.date = p_date
          and e.type = 'block'
          and e.start_time is not null and e.end_time is not null
          and tstzrange(
                (p_date::timestamp + e.start_time) at time zone v_tz,
                (p_date::timestamp + e.end_time)   at time zone v_tz
              ) && tstzrange(v_iter, v_iter + v_dur)
      ) into v_blocked;

      if not v_blocked then
        select s.starts_at into v_overlap_at
        from public.sessions s
        where s.admin_member_id = v_service.admin_member_id
          and s.status <> 'cancelled'
          and public.session_range(s.starts_at, s.duration_min)
              && tstzrange(v_iter, v_iter + v_dur)
        limit 1;

        if v_overlap_at is null then
          v_status := 'available';
        elsif v_overlap_at = v_iter then
          v_status := 'booked';
        else
          v_status := 'blocked';
        end if;
      end if;
    end if;

    if v_iter <= now() then
      v_status := 'past';
    end if;

    slot_at := v_iter;
    slot_status := v_status;
    return next;
    v_iter := v_iter + make_interval(mins => p_step_minutes);
  end loop;
end;
$$;

grant execute on function public.solo_slot_grid(uuid, date, int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- free_solo_slots — same timezone fix
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.free_solo_slots(
  p_service_id    uuid,
  p_date          date,
  p_step_minutes  int default 30
)
returns setof timestamptz
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id       uuid := auth.uid();
  v_service       public.services%rowtype;
  v_tz            text;
  v_weekday       int;
  v_studio_hours  public.studio_hours%rowtype;
  v_dur           interval;
  v_iter          timestamptz;
  v_end           timestamptz;
  v_blocked       boolean;
  v_in_window     boolean;
  v_overlaps      boolean;
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

  select coalesce(timezone, 'UTC') into v_tz
    from public.studios where id = v_service.studio_id;
  v_tz := coalesce(v_tz, 'UTC');

  v_weekday := extract(dow from p_date)::int;
  select * into v_studio_hours
    from public.studio_hours
    where studio_id = v_service.studio_id and weekday = v_weekday;
  if not found or v_studio_hours.closed
     or v_studio_hours.open_time is null or v_studio_hours.close_time is null then
    return;
  end if;

  v_dur := make_interval(mins => v_service.duration_min);

  select exists (
    select 1 from public.availability_exceptions
    where admin_member_id = v_service.admin_member_id
      and date = p_date
      and type = 'block'
      and start_time is null
      and end_time is null
  ) into v_blocked;
  if v_blocked then return; end if;

  v_iter := (p_date::timestamp + v_studio_hours.open_time) at time zone v_tz;
  v_end  := (p_date::timestamp + v_studio_hours.close_time) at time zone v_tz;

  while v_iter + v_dur <= v_end loop
    select exists (
      select 1 from public.availability_rules r
      where r.admin_member_id = v_service.admin_member_id
        and r.weekday = v_weekday
        and ((p_date::timestamp + r.start_time) at time zone v_tz) <= v_iter
        and ((p_date::timestamp + r.end_time)   at time zone v_tz) >= v_iter + v_dur
    ) into v_in_window;

    if v_in_window then
      select exists (
        select 1 from public.availability_exceptions e
        where e.admin_member_id = v_service.admin_member_id
          and e.date = p_date
          and e.type = 'block'
          and e.start_time is not null and e.end_time is not null
          and tstzrange(
                (p_date::timestamp + e.start_time) at time zone v_tz,
                (p_date::timestamp + e.end_time)   at time zone v_tz
              ) && tstzrange(v_iter, v_iter + v_dur)
      ) into v_blocked;

      if not v_blocked then
        select exists (
          select 1 from public.sessions s
          where s.admin_member_id = v_service.admin_member_id
            and s.status <> 'cancelled'
            and public.session_range(s.starts_at, s.duration_min)
                && tstzrange(v_iter, v_iter + v_dur)
        ) into v_overlaps;

        if not v_overlaps and v_iter > now() then
          return next v_iter;
        end if;
      end if;
    end if;

    v_iter := v_iter + make_interval(mins => p_step_minutes);
  end loop;
end;
$$;

grant execute on function public.free_solo_slots(uuid, date, int) to authenticated;
