import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads cookies from the incoming request and writes session
 * cookies back through Next 16's async cookies() API.
 *
 * Use this — not the service role client — for anything that should respect
 * RLS (i.e. reading on behalf of the logged-in user).
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local."
    );
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component without `dynamic = 'force-dynamic'`.
          // The middleware should refresh the session; this branch is safe.
        }
      },
    },
  });
}

/**
 * Service-role Supabase client. Bypasses RLS. Use only inside Route Handlers
 * or server-side jobs that need to mutate money tables (Lemon Squeezy
 * webhooks, payouts, credit grants, manual ledger entries).
 *
 * NEVER expose to the browser. NEVER import from a "use client" file.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing service-role env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local."
    );
  }
  // Use createServerClient with no cookie store — the service role doesn't
  // represent a user session.
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
