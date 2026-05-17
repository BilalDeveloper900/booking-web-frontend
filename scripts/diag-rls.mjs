// Diagnostic: for each user in the test studio, mint an access token and
// call my_threads_overview() / studio_threads_overview() to see what each
// role can read. Exposes RLS bugs immediately.

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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// Test studio details from previous diag
const TEST_STUDIO = "2244cf4e-2cba-4f8d-a807-e7dfa8c72b38";

async function main() {
  // Look up users in the test studio
  const { data: members } = await admin
    .from("studio_members")
    .select(
      "id, role, user_id, user:users!studio_members_user_id_fkey(email, name)"
    )
    .eq("studio_id", TEST_STUDIO)
    .eq("status", "active");

  console.log("Members in test studio:");
  for (const m of members ?? []) {
    const u = Array.isArray(m.user) ? m.user[0] : m.user;
    console.log(`  [${m.role}] ${u?.name} <${u?.email}>  user_id=${m.user_id}`);
  }

  // For each, mint a session and call the RPC
  for (const m of members ?? []) {
    const u = Array.isArray(m.user) ? m.user[0] : m.user;
    if (!u?.email) continue;
    console.log(`\n─── as ${m.role} ${u.name} (${u.email}) ───`);

    // Generate a magic link / sign-in token using admin api
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: u.email,
    });
    if (linkErr) {
      console.log("  generateLink failed:", linkErr.message);
      continue;
    }
    const hashed = link.properties?.hashed_token;
    if (!hashed) {
      console.log("  no hashed token returned");
      continue;
    }

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const { data: verify, error: verifyErr } = await userClient.auth.verifyOtp({
      token_hash: hashed,
      type: "magiclink",
    });
    if (verifyErr) {
      console.log("  verifyOtp failed:", verifyErr.message);
      continue;
    }
    console.log("  signed in as", verify.user?.email);

    // Test 1: SELECT threads directly (RLS)
    const { data: ths, error: thE } = await userClient
      .from("threads")
      .select("id, studio_id, last_message_at");
    console.log(
      "  SELECT threads ->",
      thE ? `ERROR: ${thE.message}` : `${ths?.length ?? 0} rows`
    );
    for (const t of ths ?? []) console.log("    ", t.id, t.last_message_at);

    // Test 2: SELECT thread_participants
    const { data: tps, error: tpE } = await userClient
      .from("thread_participants")
      .select("thread_id, member_id");
    console.log(
      "  SELECT thread_participants ->",
      tpE ? `ERROR: ${tpE.message}` : `${tps?.length ?? 0} rows`
    );

    // Test 3: SELECT messages
    const { data: ms, error: mE } = await userClient
      .from("messages")
      .select("id, thread_id, body, sender_role, kind");
    console.log(
      "  SELECT messages ->",
      mE ? `ERROR: ${mE.message}` : `${ms?.length ?? 0} rows`
    );
    for (const x of ms ?? []) console.log("    ", `[${x.sender_role}]`, `[${x.kind}]`, x.body.slice(0, 50));

    // Test 4: RPC my_threads_overview
    const { data: mto, error: mtoE } = await userClient.rpc("my_threads_overview");
    console.log(
      "  RPC my_threads_overview ->",
      mtoE ? `ERROR: ${mtoE.message}` : `${mto?.length ?? 0} rows`
    );
    for (const r of mto ?? [])
      console.log(
        "    ",
        r.thread_id,
        "other:",
        r.other_name,
        "unread:",
        r.unread_count,
        "last:",
        r.last_message_body?.slice(0, 40)
      );

    // Test 5: RPC studio_threads_overview (only meaningful for owner)
    if (m.role === "owner") {
      const { data: sto, error: stoE } = await userClient.rpc(
        "studio_threads_overview",
        { p_filter: "all" }
      );
      console.log(
        "  RPC studio_threads_overview('all') ->",
        stoE ? `ERROR: ${stoE.message}` : `${sto?.length ?? 0} rows`
      );
      for (const r of sto ?? [])
        console.log(
          "    ",
          r.thread_id,
          "admin:",
          r.admin_name,
          "client:",
          r.client_name,
          "last:",
          r.last_message_body?.slice(0, 40)
        );
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
