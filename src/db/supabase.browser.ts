/**
 * Supabase client for browser (client-side) use.
 * Uses PUBLIC_ env vars so they are available in client bundles.
 * Use this in React components and client-side code (e.g. login page auth).
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local for client-side auth."
  );
}

export const supabaseBrowser = createClient<Database>(supabaseUrl, supabaseAnonKey);
