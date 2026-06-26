-- =============================================================================
-- Book It Daily — member-readable effective plan
--
-- Feature gating (chat, finance, credits, offers, manual payments) runs in the
-- client and admin apps too, not just the owner's. But the `studio_subscriptions`
-- SELECT policy is owner-only, so non-owners can't read the plan directly.
--
-- This SECURITY DEFINER RPC is the controlled read path: any ACTIVE member of the
-- studio may read its churn-adjusted plan ('free' | 'solo' | 'studio'). It only
-- ever returns the plan string — never billing ids or status — so it's safe to
-- expose to every role. Mirrors the get_studio_payment_info pattern
-- (20260614000001_manual_payments.sql).
-- =============================================================================

create or replace function public.studio_effective_plan(p_studio_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- Caller must be an active member of this studio (any role).
  if public.my_role_in(p_studio_id) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return public.effective_plan(p_studio_id);
end;
$$;

grant execute on function public.studio_effective_plan(uuid) to authenticated;
