/**
 * Authenticated fetch for protected API routes.
 * Attaches Supabase session as Bearer token; redirects to login on 401.
 */

import { supabaseBrowser } from "@/db/supabase.browser";

const LOGIN_PATH = "/login";

export interface AuthFetchOptions extends RequestInit {
  /** Current path for redirect param on 401. Defaults to window.location.pathname. */
  redirectPath?: string;
}

/**
 * Fetches with Authorization: Bearer <session.access_token>.
 * On 401, redirects to /login?redirect=<redirectPath>.
 */
export async function authFetch(
  input: RequestInfo | URL,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { redirectPath = typeof window !== "undefined" ? window.location.pathname : "/", ...init } = options;

  const {
    data: { session },
  } = await supabaseBrowser.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    const redirectUrl = `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectPath)}`;
    window.location.href = redirectUrl;
  }

  return response;
}
