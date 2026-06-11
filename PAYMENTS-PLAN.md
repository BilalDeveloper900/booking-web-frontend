# Client → Studio Payments Plan (Book It Daily)

> **Status:** design, not yet implemented. This is the blueprint for letting a
> studio's **clients** pay (buy credits / memberships) so the **studio owner**
> receives the money, admins earn a commission, and the finance/credits/earnings
> pages become dynamic. Read alongside [BACKEND-PLAN.md](BACKEND-PLAN.md) and
> [PROJECT.md](PROJECT.md).

---

## 1. Context — why this exists

Today the app has **two money flows**, and only the first is built:

1. **Owner → Book It Daily** (the SaaS subscription, $9/$24). ✅ **Done** via
   **Polar** (Merchant of Record). See `app/api/checkout`, `app/api/portal`,
   `supabase/functions/polar-webhook`, `studio_subscriptions`.
2. **Client → Studio** (clients buy credit packs / memberships from the studio;
   money belongs to the **owner**). ❌ **Missing.** The offers + credit ledger
   exist, but there is **no payment collection**, so these pages are static:
   - Owner: [`components/screens/finance-screen.tsx`](components/screens/finance-screen.tsx) (`/owner/finance`)
   - Admin: [`components/screens/admin/earnings.tsx`](components/screens/admin/earnings.tsx) (`/admin/earnings`)
   - Client: [`components/screens/client/credits.tsx`](components/screens/client/credits.tsx) (`/client/credits`) — the **Buy** button is disabled.

This plan implements flow #2 and makes those three pages real.

---

## 2. Chosen model — **Stripe Connect (Express)**

We use **Stripe Connect** with **Express** connected accounts: each studio is a
connected account, clients pay by card, Stripe holds + pays out, and the owner gets
a **balance they withdraw** to their bank. Book It Daily is the **platform** (can
take an optional application fee); **Stripe** is the regulated money-holder, not us.

- **Onboarding:** Stripe-hosted Express onboarding (KYC) per studio → we store the
  connected account id (`acct_...`). We never store the studio's bank/card data.
- **Charges:** charge created for the studio's connected account (direct or
  destination charge) with optional `application_fee` → money lands in the studio's
  Stripe balance.
- **Payout / "withdraw":** Stripe pays the studio's balance to their bank; the owner
  manages it via the Express dashboard link / our payout UI.
- **Polar stays only for flow #1** (the studio's SaaS subscription to us).

> ⚠️ **HARD REQUIREMENT — platform country.** A Stripe Connect **platform** must be
> registered in a Stripe-supported country. **Pakistan is NOT supported.** So to go
> **LIVE** you need a **US LLC / UK Ltd** (e.g. via Stripe Atlas) to own the Stripe
> platform account. **Build + test work now in TEST mode from anywhere** — only
> live/production is gated on the entity.
>
> **Fallback if no entity:** BYOP (studio connects its *own* Stripe, money direct to
> them, no platform/withdraw) or Manual — both ship from Pakistan today. Kept behind
> the same provider interface so we can switch without rewrites.

---

## 3. The owner ↔ admin money model

- All client money lands in the **owner's** account (the studio is the merchant).
- **Admins earn a commission**, not direct payments. `studio_members.commission_pct`
  (owner sets it per admin) → the app **computes** each admin's earnings on the
  sessions they deliver → the owner **pays admins out** (payroll/bank). The app is
  the **ledger + report**; it does not move admin money in v1.
- Tables already exist: `payments`, `payouts`, `credit_transactions`,
  `client_credits`, `subscription_plans`, `credit_packs`, `client_subscriptions`
  (see `supabase/migrations/20260510000001_init.sql`).

**Example:** Client buys a 10-credit pack for $100 → owner's account gets $100 →
client books with Camille (1 credit) → Camille's earning = `commission_pct` of that
session's value → month-end the app says "owner owes Camille $X" → owner pays her.

---

## 4. Architecture — pluggable payment providers

One **provider-agnostic interface**; each provider is an adapter. Ship the minimum,
add more on demand. The studio picks its provider in **Owner → Settings → Payments**.

```
PaymentProvider (interface)
  createCheckout({ studioAccount, item, client, successUrl }) -> { url }
  // for recurring:
  createSubscriptionCheckout(...) -> { url }
  refund({ studioAccount, paymentRef, amount? }) -> void
  cancelSubscription({ studioAccount, subRef }) -> void
  verifyWebhook(req, secret) -> NormalizedEvent
```

Launch adapters:
- **`stripe`** — integrated/automatic. Covers most US/UK fitness studios. **Build first.**
- **`manual`** — universal fallback. Owner shares any method (PayPal/Square/bank/cash/payment-link); owner clicks **"Mark paid"** → credits granted. Zero per-provider code; unblocks everyone.

Add later, driven by demand: **`square`**, **`paypal`**, **`polar` (studio's own org)**.

> Each integrated provider ≈ a mini-Polar project (auth + checkout + webhook +
> refund + testing). Resist adding them until studios ask.

---

## 5. Data model additions

New table — **`studio_payment_accounts`** (the studio's connected provider):
```
studio_id            uuid FK studios   (PK)
provider             text  check in ('stripe_connect','manual')  -- 'stripe'(BYOP)/'square'/'paypal' later
stripe_account_id    text  -- Connect account id (acct_...) — primary for Stripe Connect
charges_enabled      bool  -- mirrored from Stripe `account.updated` (onboarding done?)
payouts_enabled      bool
details_submitted    bool
status               text  ('pending','connected','restricted','disconnected')
payout_note          text  -- manual mode only: how clients pay (link / bank / cash)
credential_ref       text  -- only for BYOP key-based providers; NOT used by Connect
created_at, updated_at
```
> Stripe Connect needs **no studio secret key** — we act for the connected account
> using OUR platform key + the `stripe_account_id` (`Stripe-Account` header).

Extend existing rows (map the old `ls_*` fields to the active provider):
- `subscription_plans.provider_price_id`, `credit_packs.provider_price_id`
  (replace/augment `ls_variant_id`) — the provider's price/product id created when
  the owner publishes an offer.
- `payments`: add `provider`, `provider_payment_id`, `provider_refund_id`,
  `refunded_cents`. (`type` already supports `client_subscription`/`client_topup`/`manual`.)
- `client_subscriptions`: add `provider`, `provider_subscription_id`
  (mirror the Polar pattern already used on `studio_subscriptions`).
- `credit_transactions`: already has `type` incl. `topup/refund/monthly_grant/spend` —
  reuse; link `related_payment_id`.

**Security:** provider secret keys are written/read **server-side only** (Route
Handlers / edge functions using the service role), stored **encrypted**, never sent
to the browser, never in a `NEXT_PUBLIC_` var.

---

## 6. Phased build (Stripe Connect Express)

> All phases buildable + testable in **Stripe TEST mode** from anywhere. Go-LIVE
> needs the US/UK platform entity (see §2). Stripe SDK: `stripe` (server) — uses our
> platform secret key + `stripeAccount`/`Stripe-Account` header to act for a studio.

### Phase 0 — Platform + provider abstraction
- Stripe platform account (test), enable **Connect → Express**.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (`NEXT_PUBLIC_`),
  `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`.
- `lib/payments/types.ts` (`PaymentProvider` interface) + `lib/stripe.ts` (platform client).
- Migration: `studio_payment_accounts` + the column additions in §5.

### Phase 1 — Connect onboarding (studio becomes a connected account)
- `POST /api/connect/account` → create Express account (`acct_...`) for the studio,
  store in `studio_payment_accounts`.
- `POST /api/connect/account-link` → Stripe-hosted onboarding link; return to
  **Owner → Settings → Payments**.
- **Owner → Settings → Payments** card: "Connect payouts" button → onboarding;
  show status (pending / connected / restricted) + "Open Stripe dashboard" (login link).
- Webhook `account.updated` → set `charges_enabled` / `payouts_enabled` /
  `details_submitted`.
- *Outcome:* studios can receive money; nothing charged yet.

### Phase 2 — Client buys credits (one-off) + make pages dynamic
- Publish offer → create Stripe **Price/Product** (platform, or on the account) →
  `provider_price_id`.
- Client **Buy** → `POST /api/store/checkout` → Checkout Session **for the connected
  account** (direct charge with `Stripe-Account`, or destination charge with
  `transfer_data.destination`) + optional `application_fee_amount`.
- Webhook `checkout.session.completed` / `payment_intent.succeeded` → record
  `payments`, **grant credits** (`credit_transactions` topup), update `client_credits`.
- **Make all 3 pages dynamic** off the real ledger (§7).
- *Outcome:* card top-ups; money in the studio's Stripe balance; you keep the optional fee.

### Phase 3 — Memberships (recurring)
- Recurring `subscription_plans` → Stripe subscription on the connected account.
- Webhook `invoice.paid` → grant the period's credits (`monthly_grant`), advance
  `client_subscriptions.current_period_*` (mirrors the Polar SaaS flow).

### Phase 4 — Refunds & cancellations (+ commission reversal) — see §8
1. **Booking cancel → credit refund** (no money): window policy →
   `credit_transactions(type='refund')`; reverse the admin's pending commission.
2. **Pack money refund**: owner clicks **Refund** → Stripe refund on the connected
   account (`reverse_transfer` / `refund_application_fee` as configured) → webhook →
   remove credits + log `provider_refund_id`; reverse commission.
3. **Membership cancel**: cancel the connected-account subscription → webhook → stop
   monthly grants, mark cancelled till period end.
- Owner sets/display a **per-studio client refund policy** (separate from our SaaS
  [Refund Policy](app/refund-policy/page.tsx)).

### Phase 5 — Owner balance + withdraw + admin payouts
- **Owner → Finance**: show Connect **balance** + recent payouts (Stripe balance/
  payouts API) + **"Manage payouts"** (Express dashboard login link). This is the
  "withdraw" experience.
- **Admin payouts**: report "owe per admin" (commission on delivered sessions) and
  mark paid; optional automation later via Stripe **transfers** to admins' own
  connected accounts.

### Phase 6 — Fallback providers (only if needed)
- `manual` adapter (record-only) for studios that can't use Stripe; same interface.

---

## 7. Making the three pages dynamic

All read the **same ledger** (no new sources of truth):

- **`/client/credits`** ([client/credits.tsx](components/screens/client/credits.tsx)):
  live balance from `client_credits`; offers from `subscription_plans`/`credit_packs`
  (already real via `lib/offers.ts`); **Buy** → checkout (manual or Stripe);
  transaction history from `credit_transactions` (`lib/credits.ts`).
- **`/owner/finance`** ([finance-screen.tsx](components/screens/finance-screen.tsx)):
  revenue in from `payments` (topup + subscription), credits sold, MRR from
  `client_subscriptions`, outgoing `payouts`, per-admin amounts owed
  (extend `lib/owner-overview.ts`).
- **`/admin/earnings`** ([admin/earnings.tsx](components/screens/admin/earnings.tsx)):
  per-session statement = session value × `commission_pct`, weekly bars, service mix,
  payout status — from `bookings ⋈ sessions ⋈ services` + `payouts`
  (extend `lib/admin-overview.ts`; replace `ADMIN_STATEMENTS` mock in `lib/data.ts`).

---

## 8. Refund & cancellation summary

| Case | Money moves? | Where | App's job |
|---|---|---|---|
| Booking cancel | No (credits) | In-app | Refund credits per window; reverse admin commission |
| Pack refund | Yes | **Studio's** account | Trigger refund (integrated) or owner records (manual); remove credits; reverse commission |
| Membership cancel | Stops future | Studio's provider | Stop monthly grants; mark cancelled till period end |

Golden rule: **the studio (its connected account) owns the money + the refund
decision + its client refund policy; Stripe holds & moves the funds — not us.** Our
app keeps credits, payments, and commissions consistent + reverses commission on refunds.

---

## 9. Open decisions
1. **Money model:** ✅ **Resolved** — **Stripe Connect (Express)**. ⚠️ Go-live needs a
   **US/UK platform entity** (Pakistan can't be the Connect platform); build/test now
   in TEST mode. `manual` kept as fallback.
2. **Charge type:** direct charge (studio = merchant of record, simplest) vs
   destination charge (platform-centric, easier fee/refund control). *Lean: destination
   charges with `transfer_data` so the platform controls fees/refunds cleanly.*
3. **Admin payouts:** report-and-pay-manually now (recommended) vs automated Stripe
   transfers later.
4. **Admin commission base:** ✅ **Resolved** — use the **service price** (`services.gross_price_cents`, already set by the owner/admin in the Services panel) × `commission_pct`. No separate "credit value" setting needed. (Replace the 100¢/credit proxy in `lib/admin-overview.ts`.)
5. **Per-studio refund policy:** free-text vs structured cancellation window.

---

## 10. Verification (per phase) — Stripe TEST mode
- **Phase 1:** complete Express onboarding (test) → `account.updated` webhook sets
  `charges_enabled`; Owner → Settings → Payments shows "connected".
- **Phase 2:** test card `4242…` → checkout for the connected account → webhook →
  credits granted (`client_credits` up, `payments` + `credit_transactions(topup)` rows);
  funds appear in the connected account's test balance; pages reflect it.
- **Phase 4:** refund a pack → credits removed, `provider_refund_id` set, admin
  commission reduced; finance shows the refund.
- **Phase 5:** Owner → Finance shows the connected balance + "Manage payouts" opens the
  Express dashboard (test).
- Read-only DB checks via service role (same pattern as `scripts/verify-*.mjs`).

---

## 11. What is already built (reuse, don't rebuild)
- Offers CRUD: `lib/offers.ts`, `components/screens/offers-screen.tsx`,
  `subscription_plans` + `credit_packs`. ✅
- Credit ledger + balance trigger: `client_credits`, `credit_transactions`,
  `lib/credits.ts`, `gift_credits` RPC. ✅
- Credit spend on booking: `book_solo` (`supabase/migrations/20260512000002_solo_booking.sql`). ✅
- Commission field + payouts table: `studio_members.commission_pct`, `payouts`. ✅
- Polar pattern to mirror for the studio's own provider: `app/api/checkout`,
  `app/api/portal`, `supabase/functions/polar-webhook`, `lib/subscription.ts`. ✅
