/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';
import type { Database } from './db/database.types';

declare global {
  namespace App {
    interface Locals {
      /** Supabase client (authenticated on protected API routes). Typed with app Database. */
      supabase: SupabaseClient<Database>;
      /** Set only on protected API routes after successful auth. */
      userId?: string;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
