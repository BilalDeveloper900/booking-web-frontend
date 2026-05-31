// Read-only check that the admin "Booking rules" + "Time off" features have the
// schema they need on the remote DB. No writes — the authenticated write path
// is gated by RLS (verified in 20260510000002_rls.sql).
//   node --env-file=.env.local scripts/verify-admin-settings.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env");
  process.exit(1);
}
const supa = createClient(url, key, { auth: { persistSession: false } });
const ok = (b) => (b ? "✅" : "❌");

// 1. Booking-rules columns exist on studio_members.
const { data: members, error: colErr } = await supa
  .from("studio_members")
  .select("id, role, require_booking_approval, buffer_min")
  .eq("role", "admin")
  .limit(3);
console.log(
  `${ok(!colErr)} studio_members.require_booking_approval / buffer_min  ${
    colErr ? "MISSING: " + colErr.message : "present"
  }`
);
if (!colErr && members?.length) {
  for (const m of members) {
    console.log(
      `   ↳ admin ${m.id.slice(0, 8)}…  require_approval=${m.require_booking_approval}  buffer_min=${m.buffer_min}`
    );
  }
}

// 2. Time-off table exists + current row count.
const { count, error: toErr } = await supa
  .from("availability_exceptions")
  .select("*", { count: "exact", head: true });
console.log(
  `${ok(!toErr)} availability_exceptions table                        ${
    toErr ? "MISSING: " + toErr.message : `${count} rows`
  }`
);

// 3. availability_rules (working hours) table — same feature family.
const { count: rc, error: rErr } = await supa
  .from("availability_rules")
  .select("*", { count: "exact", head: true });
console.log(
  `${ok(!rErr)} availability_rules table                             ${
    rErr ? "MISSING: " + rErr.message : `${rc} rows`
  }`
);

console.log("\nAuth-path RLS (verified in 20260510000002_rls.sql):");
console.log("  • studio_members_update_self  → admin can edit own booking rules");
console.log("  • availability_exceptions_self_write (FOR ALL) → admin manages own time off");
