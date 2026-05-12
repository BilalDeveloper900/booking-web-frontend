import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`. This file:
 *  1) Refreshes the Supabase auth session on every navigation so server
 *     components see a valid user.
 *  2) Gates `/owner`, `/admin`, `/client` behind a session.
 *  3) Bounces logged-in users away from `/login` and `/signup`.
 *
 * Skips static assets and Next internals via the `matcher` config below.
 */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/join",
  "/forgot-password",
  "/reset-password",
];
const PROTECTED_PREFIXES = ["/owner", "/admin", "/client"];
const AUTH_PAGES = ["/login", "/signup", "/join", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // No-op if env isn't set yet (e.g. fresh clone before .env.local).
  if (!url || !anon) return NextResponse.next();

  const response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() refreshes the session if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.some((p) => path === p);

  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage) {
    // Find the user's primary membership to send them to the right dashboard.
    const { data: rows } = await supabase
      .from("studio_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active");
    const roles = (rows ?? []).map((r) => r.role as string);
    const target = roles.includes("owner")
      ? "/owner"
      : roles.includes("admin")
        ? "/admin"
        : roles.includes("client")
          ? "/client"
          : "/owner"; // fresh user with no membership yet — owner signup flow
    const redirect = request.nextUrl.clone();
    redirect.pathname = target;
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every page, but skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};

// Suppress unused-var lint (PUBLIC_PATHS is documentation for now).
void PUBLIC_PATHS;
