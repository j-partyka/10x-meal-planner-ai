/**
 * Supabase server client for middleware (SSR).
 * Uses cookies so session is available server-side; use with @supabase/ssr.
 */

import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export interface ServerCookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]): void;
}

/**
 * Creates a Supabase client for the server (middleware) that reads/writes auth via cookies.
 * Pass an adapter that uses the request Cookie header for getAll and Astro cookies for setAll.
 */
export function createSupabaseServerClient(adapter: ServerCookieAdapter) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY for server-side auth. Add them to .env.local.");
  }
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => adapter.getAll(),
      setAll: (cookies) => adapter.setAll(cookies),
    },
  });
}

/**
 * Parses the Cookie header string into an array of { name, value }.
 */
export function parseCookieHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader?.trim()) return [];
  return cookieHeader.split(";").map((part) => {
    const [name, ...valueParts] = part.trim().split("=");
    const raw = valueParts.join("=").trim();
    let value = raw;
    try {
      value = decodeURIComponent(raw ?? "");
    } catch {
      value = raw ?? "";
    }
    return { name: name?.trim() ?? "", value };
  });
}
