import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`. This file:
 *  1) Refreshes the Supabase auth session on every navigation.
 *  2) Gates `/owner`, `/admin`, `/client` behind a session AND the correct role.
 *  3) Bounces already-signed-in users away from `/login` / `/signup`, but
 *     leaves `/join?invite=…` alone so invitees can still accept invites.
 *
 * Server-component layouts run `requireRole()` for the actual enforcement;
 * this proxy is the early cheap reject so RSC code doesn't have to be the
 * only line of defense.
 */

const ROLE_PREFIXES = ["/owner", "/admin", "/client"] as const;
type RolePrefix = (typeof ROLE_PREFIXES)[number];
type Role = "owner" | "admin" | "client";

const AUTH_PAGES_AUTOREDIRECT = ["/login", "/signup"] as const;

function matchRolePrefix(path: string): RolePrefix | null {
  for (const p of ROLE_PREFIXES) {
    if (path === p || path.startsWith(`${p}/`)) return p;
  }
  return null;
}

function roleHome(role: Role): RolePrefix {
  return `/${role}` as RolePrefix;
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const requestedPrefix = matchRolePrefix(path);
  const isAuthRedirectPage = AUTH_PAGES_AUTOREDIRECT.some((p) => path === p);

  // Unauthenticated user hitting a role-scoped route → /login.
  if (!user && requestedPrefix) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user) {
    // Fetch the user's active memberships once.
    const { data: rows } = await supabase
      .from("studio_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active");
    const roles = ((rows ?? []).map((r) => r.role) as Role[]) ?? [];
    const primaryRole: Role | null =
      roles.find((r) => r === "owner") ??
      roles.find((r) => r === "admin") ??
      roles.find((r) => r === "client") ??
      null;

    // Logged-in user on /login or /signup → send to their dashboard if they
    // have one. If not (post-confirmation flow), let /login render — it knows
    // how to provision via user_metadata.
    if (isAuthRedirectPage && primaryRole) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = roleHome(primaryRole);
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    // Logged-in user trying to access a role they don't have → send them to
    // their own dashboard, or back to /login if they're an orphan.
    if (requestedPrefix) {
      const requestedRole = requestedPrefix.slice(1) as Role;
      if (!roles.includes(requestedRole)) {
        const redirect = request.nextUrl.clone();
        if (primaryRole) {
          redirect.pathname = roleHome(primaryRole);
          redirect.search = "";
        } else {
          // No membership at all — back to /login, where ensureProvisioned
          // can finish setup based on user_metadata.
          redirect.pathname = "/login";
          redirect.searchParams.set("orphan", "1");
          redirect.searchParams.set("next", path);
        }
        return NextResponse.redirect(redirect);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
