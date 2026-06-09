-- =============================================================================
-- Book It Daily — Polar billing
--
-- The owner's SaaS subscription is now sold through Polar (Merchant of Record).
-- Store Polar's identifiers on the existing studio_subscriptions row so the
-- webhook (Supabase Edge Function `polar-webhook`) can keep it in sync and the
-- customer portal can look the customer up.
-- =============================================================================

alter table public.studio_subscriptions
  add column if not exists polar_subscription_id text,
  add column if not exists polar_customer_id     text;

create index if not exists studio_subscriptions_polar_customer_idx
  on public.studio_subscriptions (polar_customer_id);
