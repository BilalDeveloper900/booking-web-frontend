// Read-only check that the notifications backend (migration 20260525000001)
// is actually present on the remote DB. Run with:
//   node --env-file=.env.local scripts/verify-notifications.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supa = createClient(url, key, { auth: { persistSession: false } });

const ok = (b) => (b ? "✅" : "❌");

// 1. Table exists + total / unread counts.
const { count: total, error: tErr } = await supa
  .from("notifications")
  .select("*", { count: "exact", head: true });
console.log(`${ok(!tErr)} table public.notifications        ${tErr ? "MISSING: " + tErr.message : `${total} rows`}`);

if (!tErr) {
  const { count: unread } = await supa
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  console.log(`   ↳ unread rows                      ${unread}`);

  // breakdown by kind (sample of latest 200)
  const { data: sample } = await supa
    .from("notifications")
    .select("kind, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sample?.length) {
    const byKind = {};
    for (const r of sample) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    console.log("   ↳ by kind (latest 200):           " + JSON.stringify(byKind));
    console.log("   ↳ most recent:                    " + sample[0].created_at);
  }
}

// 2. Function existence probes. A missing function returns PostgREST code
//    PGRST202 ("Could not find the function ..."). Any other error means the
//    function EXISTS but rejected our (intentionally unauthenticated/dummy) call.
async function probeFn(name, args) {
  const { error } = await supa.rpc(name, args);
  if (!error) return { exists: true, note: "callable" };
  const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message);
  return { exists: !missing, note: error.message };
}

const dummy = "00000000-0000-0000-0000-000000000000";
for (const [name, args] of [
  ["mark_all_notifications_read", {}],
  ["staff_member_ids", { p_studio_id: dummy }],
  ["owner_member_id", { p_studio_id: dummy }],
]) {
  const r = await probeFn(name, args);
  console.log(`${ok(r.exists)} function public.${name.padEnd(28)} ${r.exists ? "present" : "MISSING — " + r.note}`);
}

console.log(
  "\nNote: DB triggers + the realtime publication can't be introspected through\n" +
  "PostgREST. Existing notification rows above are direct evidence the triggers\n" +
  "have fired. To confirm live, create a booking in the app and watch the bell."
);
