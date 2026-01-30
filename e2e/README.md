# E2E Tests (Playwright)

End-to-end tests for critical user journeys: authentication, inventory CRUD, meal plan generation, and shopping list. Tests use the Page Object Model and `data-test-id` locators (see `.ai/e2e-component-structure.md`).

## Prerequisites

- **Chromium** (Playwright installs it): `npx playwright install chromium`
- **`.env.test`** in the project root with:
  - `E2E_USERNAME` – email of the test user (must exist in Supabase Auth)
  - `E2E_PASSWORD` – password for that user
  - `SUPABASE_URL`, `SUPABASE_KEY` – Supabase project URL and anon key (same project where the E2E user exists)

The **app** under test is started by Playwright’s webServer via **`npm run dev:e2e`** (see `scripts/dev-e2e.js`). The script writes **`.env.e2e`** from `.env.test` (Supabase URL/key) and runs `astro dev --mode e2e`, so Vite loads `.env.e2e` and it overrides `.env.local` for that mode. Create the test user in Supabase Auth (Dashboard → Authentication → Users) if needed.

## Running tests

From the project root:

```bash
npm run test:e2e
```

Playwright loads `.env.test` so tests can use `E2E_USERNAME` and `E2E_PASSWORD`. The dev server is started with `npm run dev:e2e` (using `.env.test`) unless already running.

- **Headless (default):** `npm run test:e2e`
- **Headed (see browser):** `npx playwright test --headed`
- **Single file:** `npx playwright test e2e/auth.spec.ts`
- **UI mode:** `npx playwright test --ui`
- **Debug:** `npx playwright test --debug`
- **Trace on failure:** traces are saved on first retry; open with `npx playwright show-trace trace.zip`

Tests that require login will **skip** if `E2E_USERNAME` or `E2E_PASSWORD` is missing in `.env.test`.

## Test structure

| File | Scenarios |
|------|-----------|
| `smoke.spec.ts` | Login page load; unauthenticated redirect |
| `auth.spec.ts` | A1 redirect, A2/A3 login, A7 session, A8 logout, MW4 redirect param |
| `inventory.spec.ts` | I3 add, I7 edit, I9 search, I8 delete (with login) |
| `meal-plan.spec.ts` | M7 disabled when empty, M8/M9 generate and regenerate, link to shopping list |
| `shopping-list.spec.ts` | S4 no-plan state, S4 grouped list after generate |

Page objects live in `pages/`; auth helpers in `fixtures/auth.ts`.

## Configuration

- **playwright.config.ts** – Chromium only, `testIdAttribute: "data-test-id"`, webServer runs `npm run dev:e2e` (one env file: `.env.test`). `.env.test` is loaded at config load time so `process.env.E2E_USERNAME` / `process.env.E2E_PASSWORD` are available in tests.
