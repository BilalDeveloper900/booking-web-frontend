// Diagnostic: counts + samples of chat data, using the service role to
// bypass RLS. Lets us see exactly what got written and whether the auto-post
// trigger fired.
//
// Run:  node scripts/diag-chat.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

function row(label, value) {
  console.log(`  ${label.padEnd(30)} ${value}`);
}

async function main() {
  console.log("─── COUNTS (across all studios) ───");

  for (const t of ["studios", "studio_members", "threads", "thread_participants", "messages", "bookings"]) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    row(t, error ? `error: ${error.message}` : count);
  }

  console.log("\n─── studios ───");
  const { data: studios } = await sb.from("studios").select("id, name, owner_id");
  for (const s of studios ?? []) console.log("  ", s.id, s.name);

  console.log("\n─── studio_members (id / role / studio / user / name) ───");
  const { data: members } = await sb
    .from("studio_members")
    .select("id, role, status, studio_id, user_id, user:users!studio_members_user_id_fkey(name)")
    .order("role");
  for (const m of members ?? []) {
    const userObj = Array.isArray(m.user) ? m.user[0] : m.user;
    console.log(
      "  ",
      m.id,
      `[${m.role}]`.padEnd(9),
      m.status,
      m.studio_id.slice(0, 8),
      "user:",
      m.user_id.slice(0, 8),
      userObj?.name ?? "?"
    );
  }

  console.log("\n─── threads (id / studio / last_at) ───");
  const { data: threads, error: threadsErr } = await sb
    .from("threads")
    .select("id, studio_id, last_message_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (threadsErr) console.log("  ERROR:", threadsErr.message);
  for (const t of threads ?? []) {
    console.log("  ", t.id, "studio:", t.studio_id.slice(0, 8), "last:", t.last_message_at ?? "—");
  }

  console.log("\n─── thread_participants (thread / member) ───");
  const { data: parts } = await sb
    .from("thread_participants")
    .select("thread_id, member_id, last_read_at")
    .limit(20);
  for (const p of parts ?? []) {
    console.log("  thread:", p.thread_id.slice(0, 8), "member:", p.member_id.slice(0, 8));
  }

  console.log("\n─── messages (latest 10) ───");
  const { data: msgs } = await sb
    .from("messages")
    .select("id, thread_id, sender_member_id, sender_role, kind, body, attached_booking_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  for (const m of msgs ?? []) {
    console.log(
      "  ",
      m.created_at,
      `[${m.sender_role ?? "?"}]`.padEnd(10),
      `[${m.kind}]`.padEnd(16),
      "thread:",
      m.thread_id.slice(0, 8),
      "—",
      m.body.slice(0, 70)
    );
  }

  console.log("\n─── bookings (latest 5) ───");
  const { data: bks } = await sb
    .from("bookings")
    .select("id, status, client_member_id, session_id, booked_at")
    .order("booked_at", { ascending: false })
    .limit(5);
  for (const b of bks ?? []) {
    console.log(
      "  ",
      b.booked_at,
      `[${b.status}]`.padEnd(11),
      "id:",
      b.id.slice(0, 8),
      "client:",
      b.client_member_id.slice(0, 8),
      "session:",
      b.session_id.slice(0, 8)
    );
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
