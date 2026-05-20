-- =============================================================================
-- Book It Daily -- solo session booking
--
-- free_solo_slots(service_id, date, step_minutes?) -> setof timestamptz
--   Returns bookable start times for a solo service on a given date.
--   Filtered by: studio hours, admin's availability_rules, blocking
--   exceptions on that date, and existing non-cancelled sessions for that
--   admin. Skips slots in the past.
--
-- book_solo(service_id, starts_at) -> uuid
--   Atomic: insert session + booking + credit_transactions debit.
--   Exclusion constraint rejects overlapping admin sessions; capacity
--   trigger ensures the new session's single seat isn't double-claimed.
-- =============================================================================

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

  -- Load service
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

  -- Caller must be a member of the studio (any role; defensive)
  if not exists (
    select 1 from public.studio_members
    where studio_id = v_service.studio_id
      and user_id = v_user_id
      and status = 'active'
  ) then
    raise exception 'not_a_member_of_studio' using errcode = '42501';
  end if;

  -- Studio hours for this weekday (Sun=0..Sat=6)
  v_weekday := extract(dow from p_date)::int;
  select * into v_studio_hours
    from public.studio_hours
    where studio_id = v_service.studio_id and weekday = v_weekday;
  if not found or v_studio_hours.closed
     or v_studio_hours.open_time is null or v_studio_hours.close_time is null then
    return;
  end if;

  v_dur := make_interval(mins => v_service.duration_min);

  -- Whole-day block on this date for this admin?
  select exists (
    select 1 from public.availability_exceptions
    where admin_member_id = v_service.admin_member_id
      and date = p_date
      and type = 'block'
      and start_time is null
      and end_time is null
  ) into v_blocked;
  if v_blocked then return; end if;

  -- Iterate candidate slots stepped by p_step_minutes
  v_iter := (p_date::timestamp + v_studio_hours.open_time) at time zone 'UTC';
  v_end  := (p_date::timestamp + v_studio_hours.close_time) at time zone 'UTC';
  -- The above casts treat times as UTC; since we don't yet store per-studio TZ
  -- offsets on time columns, this aligns the slot bounds to the client TZ at
  -- read time. v1 assumption: studio + client share a single timezone. Tighten
  -- when we wire multi-TZ in a later phase.

  while v_iter + v_dur <= v_end loop
    -- (a) Inside admin's availability_rules for this weekday?
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
        -- (c) Overlapping non-cancelled session for the same admin?
        select exists (
          select 1 from public.sessions s
          where s.admin_member_id = v_service.admin_member_id
            and s.status <> 'cancelled'
            and public.session_range(s.starts_at, s.duration_min)
                && tstzrange(v_iter, v_iter + v_dur)
        ) into v_overlaps;

        -- (d) Not in the past
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


-- ─────────────────────────────────────────────────────────────────────────────
-- book_solo — atomic session + booking + credit debit
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.book_solo(
  p_service_id  uuid,
  p_starts_at   timestamptz
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id     uuid := auth.uid();
  v_service     public.services%rowtype;
  v_member      public.studio_members%rowtype;
  v_balance     int;
  v_session_id  uuid;
  v_booking_id  uuid;
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
  if p_starts_at <= now() then
    raise exception 'slot_in_past' using errcode = 'P0001';
  end if;

  select * into v_member from public.studio_members
    where studio_id = v_service.studio_id
      and user_id = v_user_id
      and role = 'client'
      and status = 'active'
    limit 1;
  if not found then
    raise exception 'not_a_client_of_studio' using errcode = '42501';
  end if;

  select balance into v_balance from public.client_credits
    where member_id = v_member.id;
  v_balance := coalesce(v_balance, 0);
  if v_balance < v_service.credits_cost then
    raise exception 'insufficient_credits' using errcode = 'P0001',
      message = format('Needs %s credit(s), you have %s', v_service.credits_cost, v_balance);
  end if;

  -- Insert session (exclusion constraint catches overlaps)
  insert into public.sessions (
    studio_id, service_id, admin_member_id, starts_at, duration_min,
    capacity, status
  )
  values (
    v_service.studio_id, v_service.id, v_service.admin_member_id,
    p_starts_at, v_service.duration_min, 1, 'scheduled'
  )
  returning id into v_session_id;

  -- Insert booking (capacity trigger enforces session's single seat)
  insert into public.bookings (
    session_id, client_member_id, status, credits_charged
  )
  values (v_session_id, v_member.id, 'confirmed', v_service.credits_cost)
  returning id into v_booking_id;

  -- Debit credits via ledger
  insert into public.credit_transactions (
    member_id, delta, type, description, related_booking_id
  )
  values (
    v_member.id,
    -v_service.credits_cost,
    'spend',
    format('Booked: %s', v_service.name),
    v_booking_id
  );

  return v_booking_id;
end;
$$;

grant execute on function public.book_solo(uuid, timestamptz) to authenticated;
