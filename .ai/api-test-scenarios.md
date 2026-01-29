# API Test Scenarios (Manual & E2E)

Use this checklist to verify all REST API endpoints. Send requests with `Authorization: Bearer <supabase_access_token>` for protected routes.

## Authentication

- [ ] **401 Unauthenticated** – Call any of `/api/products`, `/api/meal-plan`, `/api/shopping-list` without `Authorization: Bearer` (or with invalid token). Expect `401` and `{ "error": "Unauthorized" }`.

## Products

### GET /api/products (list)

- [ ] **200** – With valid auth, no query. Expect `{ data: ProductDto[], meta: { total, page, limit, totalPages } }`.
- [ ] **200** – With `?search=...` (case-insensitive on name/category).
- [ ] **200** – With `?category=...`, `?sort=name|expiration_date|created_at|quantity|category`, `?order=asc|desc`, `?page=1`, `?limit=50` (max 100).
- [ ] **400** – Invalid query (e.g. invalid sort/order). Expect `{ "error": "Validation failed", "details": [...] }`.

### GET /api/products/:id

- [ ] **200** – Valid UUID owned by user. Expect single `ProductDto`.
- [ ] **400** – Invalid UUID. Expect `{ "error": "Invalid product id" }`.
- [ ] **404** – Valid UUID not found or not owned by user. Expect `{ "error": "Not found" }`.

### POST /api/products (create)

- [ ] **201** – Valid body: `name`, `quantity`, `unit`, `expiration_date`, optional `category`. Expect created `ProductDto` (with `id`, `user_id`, `created_at`).
- [ ] **400** – Missing/invalid fields (e.g. quantity ≤ 0, invalid unit, name empty). Expect `{ "error": "Validation failed", "details": [...] }`.
- [ ] **400** – Body with `user_id` (must be rejected by schema).

### PATCH /api/products/:id

- [ ] **200** – Valid UUID and partial body. Expect updated `ProductDto`.
- [ ] **400** – Invalid UUID or invalid body. Expect validation error.
- [ ] **404** – Valid UUID not found or not owned by user.

### DELETE /api/products/:id

- [ ] **204** – Valid UUID owned by user. No body.
- [ ] **400** – Invalid UUID.
- [ ] **404** – Valid UUID not found or not owned by user.

## Meal plan

### POST /api/meal-plan

- [ ] **200** – With optional `products` array and optional `startDate`. Expect `{ mealPlan: { days: [...] }, shoppingList: { items, grouped } }`.
- [ ] **200** – Without `products`: server fetches user inventory from DB; if non-empty, returns plan + list.
- [ ] **400** – Invalid body (e.g. invalid `startDate`). Expect `{ "error": "Validation failed", "details": [...] }`.
- [ ] **422** – `products` omitted and user has no products in DB. Expect `{ "error": "Add products to inventory first" }`.
- [ ] **422** – `products: []` (empty array). Same message.
- [ ] **429** – Rate limit (if applicable). Expect `{ "error": "..." }` and status 429.
- [ ] **504** – AI timeout (e.g. 60s). Expect user-facing message, status 504.
- [ ] **502/503** – AI provider failure. Expect generic message.

## Shopping list

### POST /api/shopping-list

- [ ] **200** – Valid body: `{ mealPlan: { days: [...] } }` (each day: date, breakfast, lunch, dinner; each meal: name, ingredients, instructions). Expect `{ items, grouped }` (missing ingredients vs current user inventory).
- [ ] **400** – Missing or invalid `mealPlan`. Expect `{ "error": "Validation failed", "details": [...] }`.
- [ ] **200** – After changing inventory, same meal plan yields updated list (more/fewer items).

## Error shape

- [ ] All non-2xx responses use `{ "error": "Human-readable message" }`.
- [ ] Validation (400) uses optional `details: [{ "field": "...", "message": "..." }]` where applicable.
- [ ] No stack traces or internal details in response bodies.

## Notes

- Use Supabase Auth to obtain an access token (e.g. sign in via client or REST) and pass it as `Authorization: Bearer <token>`.
- For “404 for wrong user”: create product as user A, try GET/PATCH/DELETE with user B’s token; expect 404.
- Shopping list: create a meal plan (POST /api/meal-plan), then add/remove products (POST/PATCH/DELETE /api/products), then POST /api/shopping-list with the same meal plan; verify list reflects current inventory.
