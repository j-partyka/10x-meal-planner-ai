# REST API Implementation Plan: Products, Meal Plan, and Shopping List

## 1. Endpoint Overview

This plan covers implementation of all REST API endpoints for the 10x Meal Planner MVP:

- **Products (CRUD):** List, get by ID, create, update, and delete kitchen inventory items. All operations are scoped to the authenticated user via `user_id`; Row Level Security (RLS) enforces isolation. Data is stored in `public.products`.
- **Meal plan and shopping list:** Generate a 7-day meal plan (breakfast/lunch/dinner per day) using AI (OpenRouter/GPT) and compute a shopping list of missing ingredients grouped by category. Neither the plan nor the list is persisted. When `products` is omitted in the request, the server fetches the user’s inventory from the database; authentication is required in that case.
- **Shopping list only:** Compute missing ingredients for a given meal plan against the current user inventory (e.g. after inventory changes), without calling the AI. Used when the client already has a meal plan and only needs an updated list.

Authentication is required for all endpoints. Supabase Auth (JWT) identifies the user; `user_id` is set server-side and must never be accepted in request bodies. There is no error table in the MVP; errors are logged server-side (e.g. console or logger).

---

## 2. Request Details

### 2.1 Products

| Endpoint | Method | URL | Required params | Optional params | Body |
|----------|--------|-----|-----------------|-----------------|------|
| List products | GET | `/api/products` | — | `search`, `category`, `sort`, `order`, `page`, `limit` | None |
| Get product | GET | `/api/products/:id` | `id` (path) | — | None |
| Create product | POST | `/api/products` | — | — | `name`, `quantity`, `unit`, `expiration_date`, `category`? |
| Update product | PATCH | `/api/products/:id` | `id` (path) | — | Subset of create body |
| Delete product | DELETE | `/api/products/:id` | `id` (path) | — | None |

- **List:** Query params: `search` (string), `category` (string), `sort` (one of `name`, `expiration_date`, `created_at`, `quantity`, `category`; default `expiration_date`), `order` (`asc` | `desc`; default `asc`), `page` (1-based; default `1`), `limit` (default `50`, max `100`).
- **Create body:** `name` (required, non-empty, length ≤ 200), `quantity` (required, > 0, up to 3 decimal places), `unit` (required: `kg`, `g`, `ml`, `L`, `pieces`), `expiration_date` (required, YYYY-MM-DD), `category` (optional, length ≤ 100). `user_id` must not be sent.
- **Update body:** Any subset of the create fields; same validation. `user_id` must not be sent.

### 2.2 Meal plan and shopping list

| Endpoint | Method | URL | Required params | Optional params | Body |
|----------|--------|-----|-----------------|-----------------|------|
| Generate meal plan | POST | `/api/meal-plan` | — | — | `products`?, `startDate`? |
| Compute shopping list | POST | `/api/shopping-list` | — | — | `mealPlan` (required) |

- **Generate meal plan body:** `products` (optional array of product-like items; if omitted, server fetches from DB for authenticated user), `startDate` (optional, YYYY-MM-DD; default today or next day).
- **Compute shopping list body:** `mealPlan` (required; structure with `days` array, each day with `date`, `breakfast`, `lunch`, `dinner`; each meal has `name`, `ingredients`, `instructions`).

---

## 3. Used Types

All types are defined in `src/types.ts` and `src/db/database.types.ts`. Use them in routes and services; do not redefine DTOs in API handlers.

- **Products:** `Product`, `ProductDto`, `ProductInsert`, `ProductUpdate`, `CreateProductCommand`, `UpdateProductCommand`, `ListProductsQuery`, `ProductSortField`, `SortOrder`, `PaginationMeta`, `PaginatedResponse<T>`.
- **Meal plan:** `MealPlanDto`, `MealPlanDayDto`, `MealDto`, `MealIngredientDto`, `MealPlanProductInput`, `GenerateMealPlanCommand`, `GenerateMealPlanResponse`.
- **Shopping list:** `ShoppingListDto`, `ShoppingListItemDto`, `ComputeShoppingListCommand`, `ComputeShoppingListResponse`.

Use `SupabaseClient` type from `src/db/supabase.client.ts` (or the same `Database`-generics pattern) and `context.locals.supabase` in Astro API routes. Validate request inputs with Zod schemas derived from or aligned with these types (e.g. `CreateProductCommand` → `createProductSchema`).

---

## 4. Response Details

- **GET /api/products:** `200` — Body: `{ data: ProductDto[], meta: PaginationMeta }`. `meta`: `total`, `page`, `limit`, `totalPages`.
- **GET /api/products/:id:** `200` — Body: single `ProductDto`. `404` if not found or not owned by user.
- **POST /api/products:** `201` — Body: created `ProductDto`. `400` on validation failure.
- **PATCH /api/products/:id:** `200` — Body: updated `ProductDto`. `400` validation, `404` not found/not owned.
- **DELETE /api/products/:id:** `204` — No body. `404` not found/not owned.
- **POST /api/meal-plan:** `200` — Body: `GenerateMealPlanResponse` (`mealPlan`, `shoppingList`). `400` invalid input, `422` empty inventory when fetching from DB, `429` rate limit, `502`/`503` AI failure, `504` AI timeout.
- **POST /api/shopping-list:** `200` — Body: `ComputeShoppingListResponse` (same shape as `ShoppingListDto`: `items`, `grouped`). `400` invalid or missing `mealPlan`.

Use consistent error payloads for non-2xx responses, e.g. `{ "error": "Human-readable message" }` and optionally `{ "error": "...", "details": [{ "field": "quantity", "message": "Must be greater than 0" }] }` for validation (`400`).

---

## 5. Data Flow

1. **Middleware:** Run for all requests; attach Supabase client to `context.locals.supabase`. For `/api/products`, `/api/meal-plan`, `/api/shopping-list`: resolve Supabase session (e.g. `getUser()` or equivalent); if no authenticated user, return `401` and do not call route handlers. Ensure `context.locals` can expose `user` or `userId` for handlers if desired.
2. **Products – List:** Parse and validate query with Zod (`ListProductsQuery`). Call a product service (e.g. `listProducts(supabase, userId, query)`). Service: build Supabase query with `.eq('user_id', userId)`, apply optional `search` (ilike on name/category), `category` filter, `.order(sort, { ascending })`, `.range()` for pagination; run and get total count (e.g. with `count: 'exact'`). Return `{ data, meta }`.
3. **Products – Get by ID:** Validate path param `id` as UUID. Service: `.from('products').select().eq('id', id).eq('user_id', userId).single()`. If no row, return `404`; else return `200` with row.
4. **Products – Create:** Parse body with Zod (`CreateProductCommand`). Set `user_id` from session; do not accept `user_id` from body. Service: `.from('products').insert({ ...body, user_id }).select().single()`. Return `201` with inserted row.
5. **Products – Update:** Validate path `id` (UUID). Parse body with Zod (partial `UpdateProductCommand`). Service: update only provided fields, `.eq('id', id).eq('user_id', userId)`. If no row updated, return `404`; else return `200` with updated row.
6. **Products – Delete:** Validate path `id` (UUID). Service: `.from('products').delete().eq('id', id).eq('user_id', userId)`. If no row deleted, return `404`; else return `204`.
7. **Meal plan – Generate:** Parse body with Zod (`GenerateMealPlanCommand`). If `products` omitted: fetch user products from DB (same list logic without pagination or with high limit); if empty, return `422`. Otherwise use provided `products`. Resolve `startDate` (default today or next day). Call meal-plan service: build AI prompt with expiration priority (≤3 days high, ≤7 days medium), hardcoded family profile; call OpenRouter with timeout (e.g. 60s); parse response into `MealPlanDto`. Compute shopping list from meal plan and inventory (aggregate quantities, group by category; uncategorized → “Other”/“Miscellaneous”). Return `200` with `{ mealPlan, shoppingList }`. Map AI errors: timeout → `504`, rate limit → `429`, provider errors → `502`/`503`.
8. **Shopping list – Compute:** Parse body with Zod (`ComputeShoppingListCommand`). Load current user inventory from DB. Service: extract all ingredients from `mealPlan`, subtract inventory (by name/unit), aggregate quantities, group by category. Return `200` with `{ items, grouped }`.

All DB access must use the Supabase client from `context.locals.supabase` so that the request’s auth context (and thus RLS) applies.

---

## 6. Security Considerations

- **Authentication:** Every request to `/api/products`, `/api/meal-plan`, and `/api/shopping-list` must be authenticated. Middleware should resolve the Supabase user (e.g. via cookie or `Authorization: Bearer`); if missing or invalid, respond with `401` before invoking handlers.
- **Authorization:** Do not accept `user_id` in any request body. Set `user_id` only server-side from the authenticated user. RLS on `products` restricts rows by `user_id`; use the same Supabase client/session so that RLS is enforced (do not use service role to bypass RLS for normal API operations unless explicitly required).
- **Input validation:** Validate all path params (e.g. UUID for `id`) and query/body with Zod. Use allowlists for `sort` and `order` to avoid injection. Normalize and bound `page`/`limit` (e.g. limit max 100).
- **API keys:** OpenRouter (and any other secrets) must be read from server-side environment variables (e.g. `import.meta.env.OPENROUTER_API_KEY`) and never exposed to the client.
- **Rate limiting:** Consider per-user or per-IP rate limiting for `POST /api/meal-plan` to protect AI cost and abuse; return `429` when exceeded. Optional for product mutations in MVP.

---

## 7. Error Handling

- **400 Bad Request:** Invalid or missing body/query/path (e.g. invalid unit, quantity ≤ 0, missing required field, invalid date/UUID). Return a consistent payload, e.g. `{ "error": "Validation failed", "details": [...] }`.
- **401 Unauthorized:** No valid session. Return before calling any handler for protected routes.
- **404 Not Found:** Product `id` not found or not owned by user (GET/PATCH/DELETE by id). Do not leak existence of other users’ resources.
- **422 Unprocessable Entity:** Empty inventory when server fetches products for meal plan generation. Message e.g. “Add products to inventory first”.
- **429 Too Many Requests:** AI provider or app-level rate limit; user-facing message, no internal details.
- **502 Bad Gateway / 503 Service Unavailable:** AI provider failure; generic message.
- **504 Gateway Timeout:** AI call timeout (e.g. 60s); ask user to try again.
- **500 Internal Server Error:** Unhandled server or DB errors. Log full error server-side; return generic message to client.

Use early returns in handlers: validate input first, then auth, then call service; on service/DB errors, log and return appropriate status. Do not expose stack traces or internal details in responses.

---

## 8. Performance Considerations

- **Products list:** Use DB indexes (`products_user_id_idx`, `products_expiration_date_idx`, `products_name_idx`, `products_user_id_category_idx`) for filters and sort. Cap `limit` at 100; default 50. Keep search (ilike) bounded; consider response target (e.g. &lt; 500 ms for search).
- **Meal plan:** AI call is the bottleneck (target &lt; 30 s). Use a single OpenRouter request with a clear prompt; set timeout (e.g. 60s) and handle timeout with `504`. Avoid re-calling AI for shopping list when it can be computed from the plan and inventory.
- **Shopping list:** In-memory computation over meal plan + inventory; no AI. Keep inventory fetch efficient (user-scoped, necessary columns only).

---

## 9. Implementation Steps

1. **Auth and middleware**
   - In `src/middleware/index.ts`: for requests to `/api/products`, `/api/meal-plan`, `/api/shopping-list`, get the current user (e.g. `context.locals.supabase.auth.getUser()` or session from cookie). If unauthenticated, return `401` with a consistent JSON body and do not call `next()` for those paths. Optionally set `context.locals.userId` or `context.locals.user` for handlers.

2. **Zod schemas**
   - Add validation schemas (e.g. in `src/lib/schemas` or next to services) for: `listProductsQuerySchema` (search, category, sort enum, order enum, page, limit with max 100), `createProductSchema` (name, quantity, unit enum, expiration_date, category optional), `updateProductSchema` (partial create), `uuidParamSchema` for `id`, `generateMealPlanCommandSchema` (products optional array, startDate optional date), `computeShoppingListCommandSchema` (mealPlan with days array and meal structure). Use Zod’s `.strict()` or allowlist keys where appropriate.

3. **Product service**
   - Create `src/lib/services/product.service.ts` (or equivalent). Implement: `listProducts(supabase, userId, query)` (filter by user_id, search, category, sort/order, pagination; return `{ data, total }`), `getProductById(supabase, userId, id)`, `createProduct(supabase, userId, body)`, `updateProduct(supabase, userId, id, body)`, `deleteProduct(supabase, userId, id)`. Use Supabase client passed in (from `context.locals`) so RLS applies. Handle DB errors and let route layer map to 404/500.

4. **Products API routes**
   - Create `src/pages/api/products/index.ts` for GET (list) and POST (create). Use `export const prerender = false`. GET: parse query with Zod, call product service list, return `200` with `{ data, meta }`. POST: parse body with Zod, set `user_id` from `context.locals`, call create, return `201` with created product. On validation failure return `400`; on server error log and return `500`.
   - Create `src/pages/api/products/[id].ts` for GET, PATCH, DELETE. Validate `id` (UUID). GET: call getById; if null return `404`, else `200`. PATCH: parse body (partial), call update; if no row updated return `404`, else `200` with updated product. DELETE: call delete; if no row deleted return `404`, else `204`. Use uppercase handlers (GET, PATCH, DELETE) per Astro conventions.

5. **Meal plan and shopping list services**
   - Create `src/lib/services/meal-plan.service.ts`: function to generate meal plan (accepts products array, startDate; builds prompt with expiration priority and family profile; calls OpenRouter; parses response to `MealPlanDto`). Function to compute shopping list from meal plan + inventory (aggregate ingredients, subtract inventory, group by category; uncategorized → “Other”/“Miscellaneous”). Handle timeout and map AI errors to thrown types or return values so routes can map to 504/429/502/503.
   - Optionally add `src/lib/services/shopping-list.service.ts` with a single function that takes meal plan + inventory and returns `ShoppingListDto`, and call it from both meal-plan and shopping-list endpoints to avoid duplication.

6. **Meal plan API route**
   - Create `src/pages/api/meal-plan/index.ts` (POST only). Parse body with Zod. If `products` omitted, fetch user products from DB (reuse product service list or direct query); if empty return `422`. Resolve startDate. Call meal-plan service to generate plan and shopping list. Return `200` with `{ mealPlan, shoppingList }`. Catch AI timeout → `504`, rate limit → `429`, provider errors → `502`/`503`; log and return `500` for unexpected errors.

7. **Shopping list API route**
   - Create `src/pages/api/shopping-list/index.ts` (POST only). Parse body with Zod; if `mealPlan` missing or invalid return `400`. Load current user inventory (product service list or direct query). Call shopping-list (or meal-plan) service to compute list from meal plan + inventory. Return `200` with `{ items, grouped }`.

8. **Error responses and logging**
   - Standardize JSON error shape in all routes (e.g. `{ "error": "..." }` and optionally `details` for 400). Log validation failures at debug level; log 500s and AI errors with enough context for debugging (no PII in logs). Do not write to an error table (not in MVP).

9. **Types and Supabase client**
   - Ensure `context.locals.supabase` is typed with `Database` from `src/db/database.types.ts` and that handlers use `context.locals.supabase` (no direct import of supabase client in routes per backend rule). Use shared types from `src/types.ts` for all request/response bodies.

10. **Manual and E2E checks**
    - Test each endpoint: list (with search, sort, pagination), get/create/update/delete product (including 404 for wrong user), meal plan with and without `products`, empty inventory → 422, invalid body → 400, unauthenticated → 401. Verify shopping list computation with updated inventory.
