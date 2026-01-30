import { test as setup } from "@playwright/test";

/**
 * Minimal setup project so Playwright runs global.teardown after all tests.
 * No DB setup required; teardown cleans products table for the E2E Supabase instance.
 */
setup("e2e setup placeholder", async () => {
  // No-op: tests use Supabase from .env.test; teardown cleans products after run.
});
