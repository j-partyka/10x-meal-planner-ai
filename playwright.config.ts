import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env.test so tests can use E2E_USERNAME, E2E_PASSWORD, and Supabase params.
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright E2E config — Chromium/Desktop Chrome only (per project rules).
 * Uses browser contexts, webServer for dev, and parallel execution.
 * Requires .env.test with E2E_USERNAME, E2E_PASSWORD, SUPABASE_URL, SUPABASE_KEY.
 * The webServer runs `npm run dev:e2e`, which writes .env.e2e from .env.test and
 * runs astro dev --mode e2e so the app uses the same Supabase project as the tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["./e2e/list-no-skip-reporter.ts"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    testIdAttribute: "data-test-id",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "cleanup db",
    },
    {
      name: "cleanup db",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /\.spec\.ts$/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
