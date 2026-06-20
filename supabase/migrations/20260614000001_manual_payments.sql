-- =============================================================================
-- Book It Daily — Manual client→studio payments (Option A)
--
-- The studio collects client money its own way (bank transfer, the owner's own
-- payment link, cash). The owner then RECORDS the sale here and we grant the
-- credits + log the income. No card gateway, no Stripe entity needed — works
-- from any country today. (Stripe Connect, when an LLC exists, layers on top of
-- the same `payments` / `credit_transactions` ledger — see PAYMENTS-PLAN.md.)
--
-- This migration adds three owner/member RPCs (no new tables — reuses the
-- existing ledger + the studio_payment_accounts row from 20260613):
--   • record_manual_sale     — owner records a paid sale → grants credits (atomic)
--   • set_studio_payout_note — owner saves "how clients pay me" instructions
--   • get_studio_payment_info — any studio member reads provider + payout note
-- =============================================================================

-- ── Record a manual sale: log income + grant credits atomically ──────────────
-- Owner-only. Inserts a succeeded `payments` row (provider='manual') and a
-- `topup` credit_transaction linked to it; the existing
-- apply_credit_transaction trigger bumps client_credits.balance.
-- Returns the client's new balance.
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


-- ── Owner saves the "how clients pay me" instructions ────────────────────────
-- Upserts the studio's payment-account row. We never overwrite an existing
-- provider (e.g. a future stripe_connect onboarding) — the note is
-- provider-agnostic free text shown to clients.
create or replace function public.set_studio_payout_note(
  p_studio_id uuid,
  p_note      text
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if public.my_role_in(p_studio_id) <> 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.studio_payment_accounts (studio_id, provider, payout_note, updated_at)
  values (p_studio_id, 'manual', nullif(trim(p_note), ''), now())
  on conflict (studio_id) do update
    set payout_note = nullif(trim(p_note), ''),
        updated_at  = now();
end;
$$;

grant execute on function public.set_studio_payout_note(uuid, text) to authenticated;


-- ── Any studio member reads the studio's payment provider + payout note ──────
-- Clients need the payout note (how to pay) on the credits page; the
-- studio_payment_accounts SELECT policy is owner-only, so this security-definer
-- RPC is the controlled read path for non-owners.
create or replace function public.get_studio_payment_info(p_studio_id uuid)
returns table (provider text, payout_note text)
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if public.my_role_in(p_studio_id) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select a.provider, a.payout_note
    from public.studio_payment_accounts a
    where a.studio_id = p_studio_id;
end;
$$;

grant execute on function public.get_studio_payment_info(uuid) to authenticated;
