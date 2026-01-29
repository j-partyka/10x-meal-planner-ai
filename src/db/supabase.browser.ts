/**
 * Supabase client for browser (client-side) use.
 * Uses PUBLIC_ env vars and @supabase/ssr so session is stored in cookies
 * and middleware can read it for protected route redirects.
 */

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local for client-side auth."
  );
}

export const supabaseBrowser = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
