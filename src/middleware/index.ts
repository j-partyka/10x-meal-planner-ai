import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient, parseCookieHeader } from "../db/supabase.server";
import { createAuthenticatedClient, supabaseClient } from "../db/supabase.client";
import { AUTH_REDIRECT_ROUTES, isAllowedRedirect } from "../types";

const PROTECTED_API_PREFIXES = ["/api/products", "/api/meal-plan", "/api/shopping-list"];
const LOGIN_PATH = "/login";

function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function isProtectedPagePath(pathname: string): boolean {
  return (AUTH_REDIRECT_ROUTES as readonly string[]).includes(pathname);
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

function jsonResponse(body: { error: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (isProtectedApiPath(pathname)) {
    const token = getBearerToken(context.request);
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const authClient = createAuthenticatedClient(token);
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    context.locals.supabase = authClient;
    context.locals.userId = user.id;
    return next();
  }

  const needsSessionCheck = pathname === LOGIN_PATH || isProtectedPagePath(pathname);
  if (!needsSessionCheck) {
    context.locals.supabase = supabaseClient;
    return next();
  }

  const cookieHeader = context.request.headers.get("Cookie");
  const supabase = createSupabaseServerClient({
    getAll: () => parseCookieHeader(cookieHeader),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        context.cookies.set(name, value, {
          path: (options?.path as string) ?? "/",
          maxAge: options?.maxAge as number | undefined,
          secure: options?.secure as boolean | undefined,
          httpOnly: options?.httpOnly as boolean | undefined,
          sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
        });
      });
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (pathname === LOGIN_PATH) {
    if (session) {
      const redirectParam = context.url.searchParams.get("redirect");
      const target = redirectParam && isAllowedRedirect(redirectParam) ? redirectParam : "/";
      return context.redirect(target);
    }
    context.locals.supabase = supabaseClient;
    return next();
  }

  if (!session) {
    const redirectUrl = `${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`;
    return context.redirect(redirectUrl);
  }

  context.locals.supabase = supabaseClient;
  return next();
});
