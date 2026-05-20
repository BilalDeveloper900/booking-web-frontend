-- =============================================================================
-- Book It Daily -- client booking RPCs
--
-- These run as security definer so they bypass RLS (still authorize via
-- auth.uid()). Both flows are atomic transactions:
--   book_class(session_id)          -> insert booking + debit credits
--   cancel_my_booking(booking_id)   -> cancel booking + refund credits if >24h out
--
-- Capacity is enforced by the trigger on `bookings`; insufficient credits
-- are checked here. The 24-hour refund window is hardcoded for v1.
-- =============================================================================

create or replace function public.book_class(p_session_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id     uuid := auth.uid();
  v_session     public.sessions%rowtype;
  v_service     public.services%rowtype;
  v_member      public.studio_members%rowtype;
  v_balance     int;
  v_booking_id  uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- 1) Load the session + service
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    raise exception 'session_not_found' using errcode = 'P0001';
  end if;
  if v_session.status <> 'scheduled' then
    raise exception 'session_not_available' using errcode = 'P0001';
  end if;
  if v_session.starts_at <= now() then
    raise exception 'session_already_started' using errcode = 'P0001';
  end if;

  select * into v_service from public.services where id = v_session.service_id;
  if not found then
    raise exception 'service_not_found' using errcode = 'P0001';
  end if;
  if v_service.mode <> 'group' then
    raise exception 'not_a_group_class' using errcode = 'P0001';
  end if;

  -- 2) Find caller's active client membership in this studio
  select * into v_member
  from public.studio_members
  where studio_id = v_session.studio_id
    and user_id = v_user_id
    and role = 'client'
    and status = 'active'
  limit 1;
  if not found then
    raise exception 'not_a_client_of_studio' using errcode = '42501';
  end if;

  -- 3) Already booked? Idempotent return.
  select id into v_booking_id
  from public.bookings
  where session_id = p_session_id
    and client_member_id = v_member.id
    and status <> 'cancelled'
  limit 1;
  if v_booking_id is not null then
    return v_booking_id;
  end if;

  -- 4) Check credit balance (treat missing row as 0)
  select balance into v_balance from public.client_credits where member_id = v_member.id;
  v_balance := coalesce(v_balance, 0);
  if v_balance < v_service.credits_cost then
    raise exception 'insufficient_credits' using errcode = 'P0001',
      message = format('Needs %s credit(s), you have %s', v_service.credits_cost, v_balance);
  end if;

  -- 5) Insert booking. Capacity trigger fires here; full -> raises.
  insert into public.bookings (session_id, client_member_id, status, credits_charged)
  values (p_session_id, v_member.id, 'confirmed', v_service.credits_cost)
  returning id into v_booking_id;

  -- 6) Debit credits via ledger. The trigger on credit_transactions updates
  -- client_credits.balance.
  insert into public.credit_transactions (member_id, delta, type, description, related_booking_id)
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

grant execute on function public.book_class(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- cancel_my_booking — soft-cancel + conditional refund (>24h before start)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.cancel_my_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id   uuid := auth.uid();
  v_booking   public.bookings%rowtype;
  v_session   public.sessions%rowtype;
  v_member    public.studio_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;
  if v_booking.status = 'cancelled' then
    return; -- idempotent
  end if;

  -- Caller must own this booking
  select * into v_member from public.studio_members where id = v_booking.client_member_id;
  if v_member.user_id <> v_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_session from public.sessions where id = v_booking.session_id;

  update public.bookings
    set status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = p_reason
    where id = p_booking_id;

  -- Refund only if cancelled more than 24h before the session starts
  if v_session.starts_at - now() > interval '24 hours'
     and v_booking.credits_charged > 0
  then
    insert into public.credit_transactions (
      member_id, delta, type, description, related_booking_id
    )
    values (
      v_member.id,
      v_booking.credits_charged,
      'refund',
      'Cancelled booking refund',
      p_booking_id
    );
  end if;
end;
$$;

grant execute on function public.cancel_my_booking(uuid, text) to authenticated;
