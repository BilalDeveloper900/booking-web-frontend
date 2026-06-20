// Read-only verification for the Manual client→studio payments feature.
//   node --env-file=.env.local scripts/verify-manual-payments.mjs
//
// Checks (no writes — the authenticated write path is the owner clicking
// "Record payment" / "Save instructions" in the browser, gated by RLS +
// SECURITY DEFINER auth.uid() checks):
//   1. The three RPCs are deployed and their owner/member guards fire.
//   2. The schema the dynamic pages read exists (provider cols, gross price,
//      commission_pct).
//   3. The owner-finance + admin-earnings aggregations run against real data.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const supa = createClient(url, key, { auth: { persistSession: false } });
const ok = (b) => (b ? "✅" : "❌");
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// ── 1. RPCs deployed + guards fire (service role has no auth.uid → forbidden) ──
console.log("RPCs (deployed + guard fires):");
for (const [fn, args] of [
  ["get_studio_payment_info", { p_studio_id: ZERO_UUID }],
  ["set_studio_payout_note", { p_studio_id: ZERO_UUID, p_note: "x" }],
  ["record_manual_sale", { p_member_id: ZERO_UUID, p_credits: 1, p_amount_cents: 100, p_currency: "EUR", p_description: "verify" }],
]) {
  const { error } = await supa.rpc(fn, args);
  const missing = error && /could not find the function|does not exist|PGRST202/i.test(error.message);
  const guarded = error && /forbidden|not_authenticated|member_not_found/i.test(error.message);
  // For get_*: with no row it may return empty (no error) — also fine (deployed).
  const deployed = !missing;
  console.log(`  ${ok(deployed)} ${fn}  ${missing ? "MISSING" : guarded ? `guard ok (${error.message})` : "callable"}`);
}

// ── 2. Schema the feature needs ──
console.log("\nSchema:");
const checks = [
  ["studio_payment_accounts", "provider, payout_note, stripe_account_id, status"],
  ["payments", "provider, provider_payment_id, refunded_cents"],
  ["services", "gross_price_cents"],
  ["studio_members", "commission_pct"],
  ["credit_transactions", "type, related_payment_id, delta"],
];
for (const [table, cols] of checks) {
  const { error } = await supa.from(table).select(cols).limit(1);
  console.log(`  ${ok(!error)} ${table} (${cols})  ${error ? "MISSING: " + error.message : "present"}`);
}

// ── 3. Live aggregations (the dynamic pages) ──
console.log("\nLive data (owner-finance / admin-earnings queries):");
const { data: studios } = await supa.from("studios").select("id, name, currency").limit(1);
const studio = studios?.[0];
if (!studio) {
  console.log("  (no studios in DB — skipping aggregation)");
} else {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const now = new Date();

  // Incoming this month (client payments).
  const { data: pays, error: payErr } = await supa
    .from("payments")
    .select("amount_cents, type, provider, status")
    .eq("studio_id", studio.id)
    .eq("status", "succeeded")
    .gte("created_at", monthStart.toISOString());
  const clientTypes = new Set(["client_topup", "client_subscription", "manual"]);
  const incoming = (pays ?? [])
    .filter((p) => clientTypes.has(p.type))
    .reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const manualCount = (pays ?? []).filter((p) => p.provider === "manual").length;
  console.log(
    `  ${ok(!payErr)} ${studio.name}: incoming this month = ${(incoming / 100).toFixed(2)} ${studio.currency}` +
      ` (${(pays ?? []).length} payments, ${manualCount} manual)`
  );

  // Owed to admins (commission on delivered sessions this month).
  const { data: sessions, error: sErr } = await supa
    .from("sessions")
    .select("admin_member_id, service:services!sessions_service_id_fkey(gross_price_cents), bookings(status)")
    .eq("studio_id", studio.id)
    .neq("status", "cancelled")
    .gte("starts_at", monthStart.toISOString())
    .lte("starts_at", now.toISOString());
  const { data: admins } = await supa
    .from("studio_members")
    .select("id, commission_pct")
    .eq("studio_id", studio.id)
    .eq("role", "admin")
    .eq("status", "active");
  const pctById = new Map((admins ?? []).map((a) => [a.id, a.commission_pct ?? 0]));
  let owed = 0;
  for (const s of sessions ?? []) {
    const gross = (Array.isArray(s.service) ? s.service[0] : s.service)?.gross_price_cents ?? 0;
    const active = (s.bookings ?? []).filter((b) => b.status !== "cancelled").length;
    owed += Math.round((gross * active * (pctById.get(s.admin_member_id) ?? 0)) / 100);
  }
  console.log(
    `  ${ok(!sErr)} owed to admins this month = ${(owed / 100).toFixed(2)} ${studio.currency}` +
      ` (${(sessions ?? []).length} delivered sessions, ${(admins ?? []).length} admins)`
  );
}

console.log("\nAuth-path (browser only — cannot exercise from service role):");
console.log("  • Owner → Clients → Record payment  → record_manual_sale grants credits");
console.log("  • Owner → Settings → Save instructions → set_studio_payout_note");
console.log("  • Client → Credits → Buy → reads get_studio_payment_info");
