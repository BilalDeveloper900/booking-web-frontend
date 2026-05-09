import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser Supabase client. Use inside `"use client"` components and React
 * hooks. Reads the public anon key — never the service role key.
 *
 * The session is stored in cookies (set by the server client), so a single
 * round-trip works for SSR auth.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local."
    );
  }
  return createBrowserClient<Database>(url, anon);
}
