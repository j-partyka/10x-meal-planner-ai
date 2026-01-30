# Unit Test Recommendations

Which parts of the project are worth testing with unit tests, and why.

---

## High value — pure logic, no I/O

These are pure functions or small modules with clear inputs/outputs and meaningful branches. Unit tests are fast, stable, and catch regressions without mocks or environment.

| Element | Why unit test |
|--------|----------------|
| **`src/lib/auth-validation.ts`** | `isValidEmail`, `isValidPassword`, `getSignInValidationError`, `getRegisterValidationError` — many branches (empty, invalid email, short password, mismatch). Critical for UX and security; easy to break when changing rules. |
| **`src/lib/auth-errors.ts`** | `mapSignInError`, `mapSignUpError` — map raw Supabase/auth errors to a single user message. Multiple branches (already exists, weak password, generic). Must never leak raw errors; tests lock in safe messages. |
| **`src/lib/services/shopping-list.service.ts`** | `computeShoppingList` (and its helpers: aggregate needed, subtract inventory, category map) — pure business logic: aggregate ingredients by (name, unit), subtract inventory, group by category. No DB/API; easy to test with sample `MealPlanDto` and inventory array. Core feature correctness. |
| **`src/lib/services/meal-plan.service.ts`** | `getMealPlanPrompt`, and internally `expirationPriority` — pure string/prompt building. `expirationPriority` has clear rules (≤3 days → "USE SOON", ≤7 days → "medium"). Tests guard prompt shape and expiration labels when requirements change. |
| **`src/types.ts` — `isAllowedRedirect`** | Pure redirect allowlist check. Security-sensitive; must only allow known routes. One function, small surface, high impact. |
| **`src/lib/api-responses.ts`** | `jsonResponse`, `errorResponse` — pure response builders. Assert status, `Content-Type`, and body shape (including optional `details` for 400). Ensures API contract for error payloads. |
| **Zod schemas** (`src/lib/schemas/*`) | `listProductsQuerySchema`, `createProductSchema`, `updateProductSchema`, `generateMealPlanCommandSchema`, `computeShoppingListCommandSchema`, `uuidParamSchema` — validation is the API contract. Test valid payloads, invalid types, boundaries (e.g. quantity &gt; 0, max lengths, enums, invalid UUIDs/dates). Prevents bad data reaching services. |

**Already covered:** `src/lib/utils.ts` (`cn`) — see `utils.test.ts`.

---

## Medium value — testable with mocks or small surface

| Element | Why unit test (with caveats) |
|--------|------------------------------|
| **`src/lib/services/product.service.ts`** | Heavily Supabase-bound. Unit tests need a mocked Supabase client; ROI is lower unless you extract pure helpers (e.g. query building) or focus on error-handling paths (e.g. PGRST116 → null). |
| **OpenRouter / meal-plan flow** | `openrouter.service.ts` and meal-plan API are I/O-bound. Worth unit testing: response parsing/normalization (if any), and error mapping in `openrouter.errors.ts` / `meal-plan.errors.ts` so 429/503/timeout map to the right user-facing types. |

---

## Lower priority for unit tests

| Element | Reason |
|--------|--------|
| **`src/lib/auth-fetch.ts`** | Thin wrapper around `fetch` + Supabase session; behavior is better covered by integration or E2E (real token, redirect on 401). |
| **React components** | Can be unit tested with Vitest + jsdom + Testing Library, but many are mostly UI + one or two handlers. E2E often gives better ROI for full flows. Exceptions: small presentational components with clear props → output, or components that encapsulate non-trivial logic you choose to extract. |

---

## Logic currently in components (extract to test)

If you want more unit-testable code without testing React itself, consider moving these pure helpers into `src/lib` and testing them there:

| Location | Function / logic | Benefit of extracting + testing |
|----------|------------------|----------------------------------|
| **`InventoryView.tsx`** | `filterProductsBySearch(products, searchQuery)` | Search is critical; tests for empty query, name/category match, case insensitivity. |
| **`MealPlanTable.tsx`** | `formatDayHeader(dateStr)` | Date formatting; test invalid date fallback and locale output. |
| **`GroupedShoppingList.tsx`** | `sortCategoryKeys`, `buildGroupedFromItems`, `countGroupedItems` | "Other" last, grouping from flat list, count — all pure and easy to test. |

---

## Summary

- **Prioritise:** auth validation, auth error mapping, `computeShoppingList`, meal-plan prompt/expiration helpers, `isAllowedRedirect`, API response helpers, and Zod schemas.
- **Optional:** product service with mocked Supabase; OpenRouter/meal-plan error mapping.
- **Defer for unit:** auth-fetch and most React components; cover those with integration/E2E.
- **Extract to test:** search filter, date formatting, and shopping-list grouping/sorting helpers if you want more fast, deterministic unit tests.
