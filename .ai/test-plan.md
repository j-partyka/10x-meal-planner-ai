# Test Plan — 10x Meal Planner

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This test plan defines the approach, scope, and criteria for testing the 10x Meal Planner web application. The application is a multi-user meal planning tool that combines kitchen inventory management, AI-powered weekly meal plan generation (via OpenRouter/GPT), and shopping list computation.

### 1.2 Testing Objectives

- **Functional correctness:** Verify that inventory CRUD, meal plan generation, shopping list computation, and authentication behave according to the PRD and API contracts.
- **Security and isolation:** Ensure protected routes and APIs require authentication and that user data is isolated (RLS and server-side checks).
- **Reliability:** Validate error handling for invalid input, API failures, timeouts, and rate limits.
- **Usability and compatibility:** Confirm the UI works across target screen sizes and that forms, toasts, and navigation behave as specified.
- **Performance:** Check that response times and load times align with documented targets (inventory &lt; 2s, meal plan generation &lt; 30s, search &lt; 500ms).

### 1.3 Document Scope

The plan covers unit, integration, API, end-to-end, and manual testing. It references the existing `.ai/api-test-scenarios.md` for API checklists and aligns with the PRD user stories (US-000 through US-025) and tech stack (Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase, OpenRouter).

---

## 2. Test Scope

### 2.1 In Scope

| Area | Description |
|------|-------------|
| **Authentication** | Sign-in, registration, logout, session persistence, redirect after login, protected routes and APIs. |
| **Inventory (Products)** | Create, read, update, delete products; list with search, category, sort, order, pagination; validation (name, quantity, unit, expiration_date, category). |
| **Meal plan** | POST/GET meal-plan API; prompt construction; generation with/without products in body; empty inventory handling (422); startDate resolution; timeout and error responses. |
| **Shopping list** | POST shopping-list API; computation from meal plan vs. current inventory; grouping by category; response shape (items, grouped). |
| **Middleware** | Protection of `/api/products`, `/api/meal-plan`, `/api/shopping-list` and of pages `/`, `/meal-plan`, `/shopping-list`; Bearer token validation; redirect to login with `?redirect=`. |
| **UI (React + Astro)** | Inventory view (table, search, add/edit/delete modals, expiration indicators); meal plan view (table, generate/regenerate, loading/error states); shopping list view; login/register forms and validation; navigation and logout. |
| **Schemas and types** | Zod schemas for products, meal-plan command, shopping-list command; consistency with `src/types.ts` and API contracts. |
| **Database and RLS** | Products table and `product_unit` enum; RLS policies (anon/authenticated) for SELECT, INSERT, UPDATE, DELETE. |

### 2.2 Out of Scope

- Email verification and password reset flows (optional for MVP).
- Cost or usage metering for OpenRouter.
- Offline support or PWA behavior.
- Native mobile apps.
- Load/stress testing beyond basic performance checks (unless explicitly scheduled).
- Third-party penetration testing (handled separately if required).

---

## 3. Types of Tests

### 3.1 Unit Tests

- **Targets:** Pure logic in `src/lib` (services, schemas, utils).
- **Examples:**
  - **Schemas:** Zod schemas (product create/update, list query, meal-plan command, shopping-list command) — valid/invalid inputs, boundaries (e.g. quantity &gt; 0, max lengths, enums).
  - **Services:** `expirationPriority` / prompt building in `meal-plan.service`; `computeShoppingList` in `shopping-list.service`; product service functions with mocked Supabase client.
  - **Utils:** `isAllowedRedirect`, date/string helpers if any.
- **Tools:** Vitest (or current project test runner), Zod schema tests via `.safeParse()`.
- **Location:** Co-located or `src/lib/**/*.test.ts` / `*.spec.ts`.

### 3.2 Integration Tests

- **Targets:** API routes + services with real or test database.
- **Examples:**
  - Products: GET list (query params), GET by id, POST create, PATCH update, DELETE — with authenticated Supabase client and test user.
  - Meal plan: POST with products in body; POST without products (server fetches from DB); GET prompt — with mocked or stubbed OpenRouter to avoid real API calls.
  - Shopping list: POST with valid meal plan body; assert structure of `items` and `grouped`.
  - Middleware: Requests to protected API without token → 401; with valid token → pass through (and optionally verify `locals.userId`).
- **Tools:** Vitest (or Node test runner), Supabase local or test project, optional MSW for OpenRouter.
- **Database:** Use migrations (e.g. `20260129120000_create_product_unit_and_products.sql`) and seed test user + products; clean up after tests.

### 3.3 API Tests

- **Targets:** All REST endpoints as documented in `.ai/api-test-scenarios.md`.
- **Coverage:**
  - **Auth:** 401 for missing/invalid Bearer token on `/api/products`, `/api/meal-plan`, `/api/shopping-list`.
  - **Products:** GET list (200, query validation 400); GET/PATCH/DELETE by id (200, 400 invalid UUID, 404 not found / wrong user); POST create (201, 400 validation).
  - **Meal plan:** POST 200 (with/without products, optional startDate); 400 validation; 422 empty inventory; 429/502/503/504 error handling; GET prompt 200.
  - **Shopping list:** POST 200 with valid meal plan; 400 invalid body.
- **Execution:** Manual (checklist in api-test-scenarios.md) or automated (e.g. Vitest + `fetch` with Supabase Auth token).
- **Environment:** `.env.local` with valid Supabase and OpenRouter keys for manual runs; for automated runs, use test Supabase and optionally mock OpenRouter.

### 3.4 End-to-End (E2E) Tests

- **Targets:** Critical user journeys in a real browser.
- **Suggested scenarios:**
  - **Auth:** Open login → register new user → redirect to home → logout → login again → redirect.
  - **Auth (protected):** Open `/meal-plan` without session → redirect to login with `?redirect=/meal-plan` → after login, land on `/meal-plan`.
  - **Inventory:** Login → add product → see it in list → edit quantity → search → delete with confirmation.
  - **Meal plan:** Login → ensure some products exist → go to meal plan → generate plan → see table and shopping list → regenerate.
  - **Shopping list:** After generating a plan, open shopping list → verify grouped list; (optional) add product to inventory and recompute list.
- **Tools:** Playwright or Cypress; run against `npm run dev` or deployed preview.
- **Scope:** Start with smoke (auth + one happy path); expand to PRD user stories as needed.

### 3.5 Manual / Exploratory Tests

- **UI/UX:** Forms (validation messages, disabled states), toasts, modals, empty states, loading states during meal plan generation.
- **Responsive:** Breakpoints (e.g. 375px, 768px, 1280px, 1920px) for inventory table, meal plan table, navigation.
- **Accessibility:** Keyboard navigation, focus order, labels (can be assisted by eslint-plugin-jsx-a11y and manual checks).
- **Error handling:** Disconnect network during meal plan generation; invalid form submissions; expired session.

### 3.6 Performance Tests (Light)

- **Metrics (from tech stack / PRD):** Inventory page load &lt; 2s; meal plan generation &lt; 30s; form submit &lt; 1s; search &lt; 500ms; API responses &lt; 3s where applicable.
- **Approach:** Manual timing or simple scripts (e.g. `fetch` + `performance.now()`); optional Lighthouse or WebPageTest for LCP/FCP.
- **Focus:** Critical paths (list products, generate meal plan) rather than full load testing.

---

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication

| ID | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|--------|-----------------|
| A1 | Unauthenticated access to protected page | No session | Visit `/` or `/meal-plan` or `/shopping-list` | Redirect to `/login?redirect=<path>` |
| A2 | Login with valid credentials | Registered user | Enter email/password, submit | Redirect to target (or `/`), session established |
| A3 | Login with invalid credentials | — | Submit wrong email/password | Error message, no redirect |
| A4 | Register new user | — | Fill email, password, confirm; submit | Account created, logged in, redirect to app |
| A5 | Register with existing email | User already exists | Submit same email | Validation/error message |
| A6 | Access protected API without token | — | GET `/api/products` without Authorization | 401, `{ "error": "Unauthorized" }` |
| A7 | Session persistence | Logged in | Refresh page or navigate to `/meal-plan` | Still authenticated |
| A8 | Logout | Logged in | Click logout | Redirect to login, session cleared |
| A9 | Login page when already logged in | Session valid | Visit `/login` | Redirect to `/` or `?redirect` target |

### 4.2 Inventory (Products)

| ID | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|--------|-----------------|
| I1 | List products | Logged in, some products | GET `/api/products` or open Inventory page | 200, list and meta (total, page, limit, totalPages) |
| I2 | List with query | Logged in | GET with `search`, `category`, `sort`, `order`, `page`, `limit` | 200, filtered/ordered/paginated |
| I3 | Create product (valid) | Logged in | POST with name, quantity, unit, expiration_date, optional category | 201, product in body; appears in list |
| I4 | Create product (invalid) | Logged in | POST with quantity ≤ 0 or missing name or invalid unit | 400, validation details |
| I5 | Get product by id | Logged in, product exists | GET `/api/products/:id` | 200, single product |
| I6 | Get product wrong user | User A product | GET with User B token | 404 |
| I7 | Update product | Logged in, product exists | PATCH `/api/products/:id` with partial body | 200, updated product |
| I8 | Delete product | Logged in, product exists | DELETE `/api/products/:id` | 204; GET list no longer contains it |
| I9 | Search in UI | Products in list | Type in search box | List filters by name/category in real time |
| I10 | Expiration indicators | Products with various expiration dates | View list | Red &lt;3 days, yellow &lt;7 days (or as per ExpirationIndicator) |

### 4.3 Meal Plan

| ID | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|--------|-----------------|
| M1 | Generate with body products | Logged in | POST `/api/meal-plan` with `products` array and optional `startDate` | 200, mealPlan (7 days), shoppingList, prompt |
| M2 | Generate without body (server fetches) | Logged in, inventory not empty | POST `/api/meal-plan` with `{}` or no products | 200, plan and list from DB inventory |
| M3 | Generate with empty inventory | Logged in, no products in DB and no products in body | POST with `products: []` or omit and empty DB | 422, "Add products to inventory first" |
| M4 | GET prompt | Logged in, inventory not empty | GET `/api/meal-plan?startDate=YYYY-MM-DD` | 200, `{ prompt }` consistent with buildPrompt |
| M5 | Invalid body | Logged in | POST with invalid startDate or wrong shape | 400, validation details |
| M6 | OpenRouter not configured | No OPENROUTER_API_KEY | POST with valid body | 503, clear hint |
| M7 | UI: Generate button disabled when empty | No products | Open meal plan page | Button disabled, tooltip "Add products to inventory first" |
| M8 | UI: Loading and result | Has products | Click Generate | Loading state, then table and shopping list |
| M9 | UI: Regenerate | Plan already shown | Click Regenerate | New plan replaces previous |
| M10 | Error handling (timeout/5xx) | Simulate failure or use bad key | POST | User-friendly message and retry option (per US-017) |

### 4.4 Shopping List

| ID | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|--------|-----------------|
| S1 | Compute list | Logged in, valid meal plan | POST `/api/shopping-list` with `{ mealPlan: { days: [...] } }` | 200, items and grouped by category |
| S2 | List reflects current inventory | Meal plan and inventory | Add/remove product, POST same meal plan again | Different items/grouped (missing ingredients only) |
| S3 | Invalid meal plan body | Logged in | POST with missing or invalid mealPlan | 400, validation details |
| S4 | UI: List after generate | Just generated plan | Open shopping list page or section | Grouped list matches API response |

### 4.5 Middleware and Security

| ID | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|--------|-----------------|
| MW1 | Protected API without Bearer | — | Any of GET/POST /api/products, /api/meal-plan, POST /api/shopping-list without header | 401 |
| MW2 | Protected API with invalid token | — | Authorization: Bearer invalid | 401 |
| MW3 | Protected page without session | No cookies | GET `/`, `/meal-plan`, `/shopping-list` | Redirect to login with redirect param |
| MW4 | Allowed redirect after login | Session from login | Login with `?redirect=/meal-plan` | Redirect to `/meal-plan` |
| MW5 | Disallowed redirect | — | Login with `?redirect=https://evil.com` | Redirect to `/` (isAllowedRedirect) |

---

## 5. Test Environment

### 5.1 Components

- **Application:** Astro 5 (SSR, Node adapter), React 19, TypeScript 5, Tailwind 4, Shadcn/ui.
- **Backend:** Supabase (PostgreSQL, Auth, RLS); Astro API routes for products, meal-plan, shopping-list.
- **External:** OpenRouter (GPT) for meal plan generation; optional for some tests (mock/stub).

### 5.2 Environments

| Environment | Purpose | Supabase | OpenRouter |
|-------------|---------|----------|------------|
| **Local dev** | Development and manual testing | Local or hosted project | Real key (or mock in code) |
| **Test / CI** | Automated tests | Dedicated test project or local Supabase | Mock/stub preferred |
| **Staging / Preview** | E2E and UAT | Staging project | Real or test key with limits |

### 5.3 Configuration

- **Env vars:** `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if used), `OPENROUTER_API_KEY` (server-only).
- **Test user:** Create at least one test user (email/password) in Supabase Auth for API and E2E tests.
- **Database:** Apply migrations; optionally seed products for consistent E2E data.
- **Node:** Version per `.nvmrc`.

### 5.4 Browsers and Devices (Manual / E2E)

- **Browsers:** Chrome, Firefox, Safari, Edge (latest).
- **Viewports:** 375px (mobile), 768px (tablet), 1280px (laptop), 1920px (desktop) as per PRD.

---

## 6. Testing Tools

| Purpose | Tool | Notes |
|--------|------|------|
| Unit / integration | Vitest (recommended) or Jest | Fast, ESM, TypeScript; mock Supabase and OpenRouter |
| API automation | Vitest + fetch, or Postman/Insomnia | Use `.ai/api-test-scenarios.md` as spec |
| E2E | Playwright or Cypress | Against dev or preview URL |
| Linting / static | ESLint (incl. jsx-a11y, React) | Already in project |
| Type checking | TypeScript `tsc` | Part of build |
| Schema validation | Zod | Test schemas with valid/invalid inputs |
| Supabase local | Supabase CLI (optional) | For isolated DB tests |
| Performance | Browser DevTools, Lighthouse | Ad hoc or CI |

No specific tool is mandatory; choices should match team and CI pipeline.

---

## 7. Test Schedule

| Phase | Activities | Typical Duration |
|-------|------------|------------------|
| **Pre-development** | Test plan review; environment and test user setup; add test runner if missing | 1–2 days |
| **Per feature** | Unit tests for new lib code; schema tests for new/updated Zod schemas | Ongoing |
| **API complete** | Full API test run (manual or automated) per api-test-scenarios.md | 1 day |
| **Integration** | Integration tests for API routes + DB (and mocked OpenRouter) | 1–2 days |
| **E2E** | Implement and run E2E smoke; extend to main user stories | 2–3 days |
| **Regression** | Re-run automated suite and key manual cases before release | 0.5–1 day |
| **UAT** | Manual exploratory and acceptance by stakeholder | As needed |

Schedule should be adjusted to project timeline; regression and UAT should always precede production release.

---

## 8. Test Acceptance Criteria

- **Functional:** All scenarios in Section 4 (and in `.ai/api-test-scenarios.md`) pass for the current release scope.
- **Security:** No protected API or page accessible without valid auth; no cross-user data leakage (404 for wrong user on products).
- **Validation:** Invalid inputs return 400 with consistent error shape and, where applicable, `details` array.
- **Error handling:** Meal plan timeout and provider errors return appropriate status (e.g. 429, 502, 503, 504) and user-facing message; no stack traces in responses.
- **UI:** Critical flows (login, inventory CRUD, generate plan, view shopping list) work in supported browsers and at defined breakpoints.
- **Performance:** Inventory load and search within targets; meal plan generation within 30s under normal conditions.
- **Automation:** Critical paths covered by automated tests (unit + API or E2E) so regressions are caught in CI.
- **Definition of Done:** All planned tests for the sprint/release executed; blocking bugs fixed or accepted as known issues with tickets.

---

## 9. Roles and Responsibilities

| Role | Responsibility |
|------|-----------------|
| **Developer** | Write and run unit and integration tests; fix bugs found by QA; maintain testability of code. |
| **QA Engineer** | Design and execute API, E2E, and manual tests; maintain test plan and checklists; report bugs and track resolution. |
| **Product / PM** | Prioritize test scope; clarify acceptance criteria and user stories; support UAT. |
| **DevOps / CI** | Run automated tests in CI; maintain test environment and secrets (e.g. test Supabase, env vars). |

Handoff: Developers provide build and env instructions; QA confirms environment and runs test suites; bugs are logged and assigned per project process.

---

## 10. Bug Reporting Procedures

### 10.1 What to Include

- **Title:** Short, descriptive.
- **Environment:** OS, browser/version, app version or commit.
- **Steps:** Minimal steps to reproduce.
- **Expected vs actual:** Expected result and actual result (including messages and UI).
- **Screenshots / recordings:** For UI and E2E issues.
- **Logs:** Browser console, network (sanitized), or server logs if relevant.
- **Severity:** Critical / Major / Minor / Trivial (per project definitions).

### 10.2 Severity Guidelines

- **Critical:** App unusable (e.g. login broken, all API 500), data loss, security breach.
- **Major:** Main feature broken (e.g. cannot generate meal plan, cannot save product).
- **Minor:** Feature works with workaround or small UI/validation bug.
- **Trivial:** Cosmetic or documentation.

### 10.3 Process

1. Create ticket in project tracker (e.g. GitHub Issue) with the above fields.
2. Assign severity and, if applicable, component (auth, inventory, meal-plan, shopping-list, API, UI).
3. Assignee: triage and fix or defer; link PR to ticket.
4. QA verifies fix and closes or reopens with comment.

### 10.4 Out of Scope for Bug Reports

- Feature requests (use separate “enhancement” or “feature” type).
- Environment or tooling issues that are not product bugs (document in README or runbook).

---

## References

- `.ai/prd.md` — User stories and acceptance criteria (US-000–US-025).
- `.ai/tech-stack.md` — Architecture, performance targets, security.
- `.ai/api-test-scenarios.md` — API endpoint test checklist.
- `src/types.ts` — Shared types and API contracts.
- `supabase/migrations/` — Database schema and RLS.
