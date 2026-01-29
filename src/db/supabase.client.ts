import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Creates a Supabase client with the given JWT so RLS and auth use the authenticated user.
 * Use in middleware for protected API routes.
 */
export function createAuthenticatedClient(token: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Supabase client typed with app Database. Use from src/db/supabase.client.ts in routes/services. */
export type { SupabaseClient };
