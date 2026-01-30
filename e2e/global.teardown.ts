import path from "node:path";
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "../src/db/database.types";

// Ensure .env.test is loaded so we only touch the E2E Supabase instance.
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

teardown("clean Supabase products table (E2E instance)", async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!url || !key || !email || !password) {
    throw new Error("Teardown requires .env.test: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME, E2E_PASSWORD");
  }

  const supabase = createClient<Database>(url, key);
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    throw new Error(`Teardown sign-in failed: ${signInError.message}`);
  }
  if (!user) {
    throw new Error("Teardown: no user after sign-in");
  }

  const { error: deleteError } = await supabase.from("products").delete().eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`Teardown delete products failed: ${deleteError.message}`);
  }
});
