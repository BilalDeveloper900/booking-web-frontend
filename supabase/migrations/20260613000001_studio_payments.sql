-- =============================================================================
-- Book It Daily — client→studio payments (Stripe Connect)
--
-- Flow #2 (clients buy credits/memberships; money goes to the STUDIO via the
-- studio's Stripe Connect account). See PAYMENTS-PLAN.md.
--
-- This migration adds:
--   • studio_payment_accounts — the studio's connected Stripe account + status
--   • stripe_price_id / stripe_product_id on offers (subscription_plans, credit_packs)
--   • provider/refund columns on payments
--   • provider columns on client_subscriptions
-- Nothing here charges money; it's the schema the Connect routes/webhook need.
-- =============================================================================

-- ── Connected account per studio ────────────────────────────────────────────
create table if not exists public.studio_payment_accounts (
  studio_id          uuid primary key references public.studios(id) on delete cascade,
  provider           text not null default 'stripe_connect'
                     check (provider in ('stripe_connect','manual')),
  stripe_account_id  text,                 -- Connect account id (acct_...)
  charges_enabled    boolean not null default false,
  payouts_enabled    boolean not null default false,
  details_submitted  boolean not null default false,
  status             text not null default 'pending'
                     check (status in ('pending','connected','restricted','disconnected')),
  payout_note        text,                 -- manual mode only
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.studio_payment_accounts enable row level security;

-- Owner may read their studio's payment-account status (to show in Settings).
create policy studio_payment_accounts_owner_select on public.studio_payment_accounts
  for select using (public.my_role_in(studio_id) = 'owner');

-- Writes happen server-side via the service role (onboarding routes + webhook),
-- so no insert/update policy is granted to authenticated users.

-- ── Offers ↔ Stripe price/product ids ───────────────────────────────────────
alter table public.subscription_plans
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id   text;

alter table public.credit_packs
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id   text;

-- ── payments: provider + refund tracking ────────────────────────────────────
alter table public.payments
  add column if not exists provider            text,   -- 'stripe' | 'manual' | 'polar'
  add column if not exists provider_payment_id text,
  add column if not exists provider_refund_id  text,
  add column if not exists refunded_cents      int not null default 0;

-- ── client_subscriptions: provider refs (mirror the Polar pattern) ───────────
alter table public.client_subscriptions
  add column if not exists provider              text,
  add column if not exists provider_subscription_id text;

create index if not exists payments_provider_payment_idx
  on public.payments (provider_payment_id);
create index if not exists client_subscriptions_provider_sub_idx
  on public.client_subscriptions (provider_subscription_id);
