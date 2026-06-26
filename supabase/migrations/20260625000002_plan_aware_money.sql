-- =============================================================================
-- Book It Daily — make the money/credit economy Studio-only at the DB level
--
-- Tiering (see plan soft-sprouting-parrot.md): the credit economy — offers
-- builder, credits + gifting, manual payments, finance — is a Studio feature.
-- Free/Solo studios take bookings as FREE RESERVATIONS (no credit charge).
--
-- The UI hides these controls per plan, but the booking + manual-sale RPCs are
-- SECURITY DEFINER and could be called directly, so we enforce the rule here too:
--
--   * book_solo / book_class — charge credits ONLY when effective_plan = 'studio'.
--     On Free/Solo the cost is treated as 0: no balance check, no ledger debit,
--     booking succeeds as a free reservation. This holds even if a service still
--     carries a credits_cost (e.g. after a Studio→Solo downgrade) — leftover
--     client balances simply freeze until the studio re-upgrades.
--   * record_manual_sale — hard-rejected unless effective_plan = 'studio', since
--     it always grants credits.
-- =============================================================================


-- ── book_class — group enrollment, plan-aware credit charge ───────────────────
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
  v_cost        int;
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

  -- Credits only matter on Studio; otherwise this is a free reservation.
  v_cost := case
              when public.effective_plan(v_session.studio_id) = 'studio'
                then v_service.credits_cost
              else 0
            end;

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

  -- 4) Check credit balance (only when there's a cost)
  if v_cost > 0 then
    select balance into v_balance from public.client_credits where member_id = v_member.id;
    v_balance := coalesce(v_balance, 0);
    if v_balance < v_cost then
      raise exception 'insufficient_credits' using errcode = 'P0001',
        message = format('Needs %s credit(s), you have %s', v_cost, v_balance);
    end if;
  end if;

  -- 5) Insert booking. Capacity trigger fires here; full -> raises.
  insert into public.bookings (session_id, client_member_id, status, credits_charged)
  values (p_session_id, v_member.id, 'confirmed', v_cost)
  returning id into v_booking_id;

  -- 6) Debit credits via ledger (skip for free reservations).
  if v_cost > 0 then
    insert into public.credit_transactions (member_id, delta, type, description, related_booking_id)
    values (
      v_member.id,
      -v_cost,
      'spend',
      format('Booked: %s', v_service.name),
      v_booking_id
    );
  end if;

  return v_booking_id;
end;
$$;

grant execute on function public.book_class(uuid) to authenticated;


-- ── book_solo — 1-on-1 booking, plan-aware credit charge ──────────────────────
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
  v_cost        int;
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

  -- Credits only matter on Studio; otherwise this is a free reservation.
  v_cost := case
              when public.effective_plan(v_service.studio_id) = 'studio'
                then v_service.credits_cost
              else 0
            end;

  select * into v_member from public.studio_members
    where studio_id = v_service.studio_id
      and user_id = v_user_id
      and role = 'client'
      and status = 'active'
    limit 1;
  if not found then
    raise exception 'not_a_client_of_studio' using errcode = '42501';
  end if;

  if v_cost > 0 then
    select balance into v_balance from public.client_credits
      where member_id = v_member.id;
    v_balance := coalesce(v_balance, 0);
    if v_balance < v_cost then
      raise exception 'insufficient_credits' using errcode = 'P0001',
        message = format('Needs %s credit(s), you have %s', v_cost, v_balance);
    end if;
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
  values (v_session_id, v_member.id, 'confirmed', v_cost)
  returning id into v_booking_id;

  -- Debit credits via ledger (skip for free reservations).
  if v_cost > 0 then
    insert into public.credit_transactions (
      member_id, delta, type, description, related_booking_id
    )
    values (
      v_member.id,
      -v_cost,
      'spend',
      format('Booked: %s', v_service.name),
      v_booking_id
    );
  end if;

  return v_booking_id;
end;
$$;

grant execute on function public.book_solo(uuid, timestamptz) to authenticated;


-- ── record_manual_sale — Studio-only (it grants credits) ──────────────────────
create or replace function public.record_manual_sale(
  p_member_id   uuid,
  p_credits     int,
  p_amount_cents int,
  p_currency    text default 'EUR',
  p_description text default null
)
returns int
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user        uuid := auth.uid();
  v_studio      uuid;
  v_role        text;
  v_payment_id  uuid;
  v_new_balance int;
  v_desc        text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_credits is null or p_credits <= 0 then
    raise exception 'credits_must_be_positive' using errcode = 'P0001';
  end if;

  if p_amount_cents is null or p_amount_cents < 0 then
    raise exception 'amount_invalid' using errcode = 'P0001';
  end if;

  -- Resolve the target member's studio + role.
  select studio_id, role into v_studio, v_role
  from public.studio_members
  where id = p_member_id and status = 'active';

  if v_studio is null then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;

  if v_role <> 'client' then
    raise exception 'target_is_not_a_client' using errcode = 'P0001';
  end if;

  if public.my_role_in(v_studio) <> 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Manual sales grant credits, so they're a Studio-plan feature.
  if public.effective_plan(v_studio) <> 'studio' then
    raise exception 'plan_limit_reached'
      using errcode = 'P0001',
            hint    = 'upgrade_required',
            detail  = 'credits',
            message = 'Recording payments and granting credits is a Studio plan feature. Upgrade to enable it.';
  end if;

  v_desc := coalesce(nullif(trim(p_description), ''),
                     format('Manual sale · %s credits', p_credits));

  insert into public.payments (
    studio_id, member_id, type, amount_cents, currency, status,
    provider, description
  )
  values (
    v_studio, p_member_id, 'client_topup', p_amount_cents,
    coalesce(nullif(upper(trim(p_currency)), ''), 'EUR'), 'succeeded',
    'manual', v_desc
  )
  returning id into v_payment_id;

  insert into public.credit_transactions (
    member_id, delta, type, description, related_payment_id
  )
  values (p_member_id, p_credits, 'topup', v_desc, v_payment_id);

  select coalesce(balance, 0) into v_new_balance
  from public.client_credits
  where member_id = p_member_id;

  return coalesce(v_new_balance, 0);
end;
$$;

grant execute on function
  public.record_manual_sale(uuid, int, int, text, text) to authenticated;
