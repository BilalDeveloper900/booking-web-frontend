// One-off: sends a chat message from Test Admin to Test Client in their
// existing thread, so the client side can verify the unread badge updates
// + toast fires + sidebar count moves.
//
// Run:  node scripts/seed-test-message.mjs

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

const TEST_STUDIO = "2244cf4e-2cba-4f8d-a807-e7dfa8c72b38";

async function main() {
  // Find the test-studio admin + their existing thread.
  const { data: members } = await admin
    .from("studio_members")
    .select(
      "id, role, user_id, user:users!studio_members_user_id_fkey(email, name)"
    )
    .eq("studio_id", TEST_STUDIO)
    .eq("status", "active");

  const adminMember = members?.find((m) => m.role === "admin");
  if (!adminMember) throw new Error("no admin in test studio");
  const adminUser = Array.isArray(adminMember.user)
    ? adminMember.user[0]
    : adminMember.user;

  const { data: threads } = await admin
    .from("threads")
    .select("id, studio_id")
    .eq("studio_id", TEST_STUDIO);
  const thread = threads?.[0];
  if (!thread) throw new Error("no thread found — book something first");

  console.log(`Admin: ${adminUser?.name} <${adminUser?.email}>`);
  console.log(`Thread: ${thread.id}`);

  // Mint session for the admin user and post a real message as them.
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: adminUser.email,
  });
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  await userClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });

  const body = `Test message from admin · ${new Date().toLocaleTimeString()}`;
  const { error } = await userClient.from("messages").insert({
    thread_id: thread.id,
    sender_member_id: adminMember.id,
    body,
  });

  if (error) {
    console.error("INSERT failed:", error.message);
    process.exit(1);
  }
  console.log(`\n✓ Sent: "${body}"`);
  console.log("\nNow refresh the Test Client browser:");
  console.log("  · Sidebar 'Messages' should show 1");
  console.log("  · Header chat icon should show 1");
  console.log("  · A toast should appear if NOT on /client/messages");
  console.log("  · Tab title should read '(1) Maison & Co. — …'");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
