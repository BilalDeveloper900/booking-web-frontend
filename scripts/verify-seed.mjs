// Quick sanity check: count rows in each seeded table.
// Run with: node --env-file=.env.local scripts/verify-seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false } });

const tables = [
  "users",
  "studios",
  "studio_members",
  "services",
  "studio_hours",
  "availability_rules",
  "subscription_plans",
  "credit_packs",
  "client_subscriptions",
  "client_credits",
  "credit_transactions",
  "studio_subscriptions",
  "threads",
  "messages",
];

for (const t of tables) {
  const { count, error } = await supa.from(t).select("*", { count: "exact", head: true });
  if (error) {
    console.log(String(t).padEnd(24), "ERROR:", error.message);
  } else {
    console.log(String(t).padEnd(24), count);
  }
}
