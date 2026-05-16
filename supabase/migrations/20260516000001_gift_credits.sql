-- =============================================================================
-- gift_credits -- owner gifts (or deducts) credits to a client
--
-- Inserts a credit_transactions row of type 'adjustment'. The existing
-- apply_credit_transaction trigger updates client_credits.balance.
--
-- RLS context: client_credits + credit_transactions are write-only via service
-- role normally. This RPC is the controlled path for owners to issue
-- adjustments without exposing the service role to the client.
--
-- Returns the new balance after applying the gift.
-- =============================================================================

create or replace function public.gift_credits(
  p_member_id uuid,
  p_amount    int,
  p_reason    text
)
returns int
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user        uuid := auth.uid();
  v_studio      uuid;
  v_client_role text;
  v_new_balance int;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_amount = 0 then
    raise exception 'amount_must_be_nonzero' using errcode = 'P0001';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  -- Look up the target member and verify they are a client in a studio
  -- the caller owns.
  select studio_id, role into v_studio, v_client_role
  from public.studio_members
  where id = p_member_id and status = 'active';

  if v_studio is null then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;

  if v_client_role <> 'client' then
    raise exception 'target_is_not_a_client' using errcode = 'P0001';
  end if;

  if public.my_role_in(v_studio) <> 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- For a deduction, refuse to overdraw. The balance trigger clamps to >= 0,
  -- but silently absorbing the deficit hides owner mistakes.
  if p_amount < 0 then
    select coalesce(balance, 0) into v_new_balance
    from public.client_credits
    where member_id = p_member_id;
    if coalesce(v_new_balance, 0) + p_amount < 0 then
      raise exception 'insufficient_balance' using errcode = 'P0001';
    end if;
  end if;

  insert into public.credit_transactions (member_id, delta, type, description)
  values (p_member_id, p_amount, 'adjustment', trim(p_reason));

  select coalesce(balance, 0) into v_new_balance
  from public.client_credits
  where member_id = p_member_id;

  return coalesce(v_new_balance, 0);
end;
$$;

grant execute on function public.gift_credits(uuid, int, text) to authenticated;
