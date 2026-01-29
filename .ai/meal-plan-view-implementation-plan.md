# View Implementation Plan: Meal Plan

## 1. Overview

The Meal Plan view lets users generate and view a weekly meal plan (7 days × breakfast, lunch, dinner) and regenerate it. When inventory is empty, "Generate Meal Plan" is disabled with a tooltip; when a plan exists, a "Regenerate All" action is shown. The plan and shopping list are stored in client state and sessionStorage (key: `meal-planner-plan`); they are hydrated on load. No start-date picker for MVP; the API default is used. Loading and error states (502/503/504, 429) are handled with user-facing messages and a Retry button. A link/CTA to the Shopping list is provided.

## 2. View Routing

- **Path:** `/meal-plan`
- **Astro page:** `src/pages/meal-plan.astro`
- **Protected:** Yes. Unauthenticated users are redirected to `/login`.
- **Layout:** Root layout with navigation (Inventory, Meal plan, Shopping list, Logout).

## 3. Component Structure

```
MealPlanPage (Astro page)
└── MealPlanView (React, client:load)
    ├── PageHeader
    ├── GenerateMealPlanButton (disabled when no products, tooltip "Add products to inventory first")
    ├── RegenerateAllButton (visible when plan exists)
    ├── Link/CTA to Shopping list (/shopping-list)
    ├── EmptyState (no plan + empty inventory: message + CTA to /)
    ├── EmptyStateWithInventory (no plan + has products: "Generate Meal Plan" enabled)
    ├── LoadingState (full-page or prominent: "Generating your meal plan…"; button disabled)
    ├── ErrorState (502/503/504: message + Retry; 429: message + disable retry briefly)
    └── MealPlanTable (7-day × breakfast/lunch/dinner; each cell: dish name, ingredients, instructions)
```

## 4. Component Details

### MealPlanView (container)

- **Description:** Top-level container that holds meal plan and shopping list state (and syncs to sessionStorage), fetches products count or list to enable/disable generate, and orchestrates generate/regenerate and error/retry. Renders header, buttons, link to shopping list, and conditional content: empty states, loading, error, or meal plan table.
- **Main elements:** `main`, PageHeader, GenerateMealPlanButton, RegenerateAllButton, link to `/shopping-list`, conditional EmptyState, EmptyStateWithInventory, LoadingState, ErrorState, MealPlanTable.
- **Handled events:** Mount: hydrate plan + shopping list from sessionStorage (key `meal-planner-plan`); fetch products (GET `/api/products` with limit=1 or full list) to know if inventory is empty. Generate click: set loading, POST `/api/meal-plan` (products optional—server can fetch), on success store result in state and sessionStorage, clear loading and error; on 502/503/504 set error and Retry; on 429 set message and disable retry briefly. Regenerate click: same as generate (replace plan). Retry click: same as generate. 401 → redirect to login.
- **Validation:** None at container; API returns 422 when inventory empty if server fetches products.
- **Types:** Uses `MealPlanDto`, `ShoppingListDto`, `GenerateMealPlanResponse`, `ProductDto`. State: `mealPlan: MealPlanDto | null`, `shoppingList: ShoppingListDto | null`, `productsCount: number` or `hasProducts: boolean`, `loading: boolean`, `error: { kind: 'retry' | 'rate_limit'; message: string } | null`.
- **Props:** None.

### PageHeader

- **Description:** Page title (e.g. "Meal Plan").
- **Main elements:** `h1`.
- **Props:** Optional `title?: string`.

### GenerateMealPlanButton

- **Description:** Primary button "Generate Meal Plan". Disabled when inventory is empty; when disabled show tooltip "Add products to inventory first".
- **Main elements:** Button, Tooltip (Shadcn).
- **Handled events:** Click: trigger generate (only when enabled).
- **Types:** `disabled: boolean`, `onClick: () => void`, `loading?: boolean`.
- **Props:** `disabled`, `onClick`, `loading`.

### RegenerateAllButton

- **Description:** Secondary button "Regenerate All" or "Regenerate Meal Plan". Visible only when a plan exists. No confirmation; same loading behavior as first generation.
- **Main elements:** Button.
- **Handled events:** Click: trigger same generate flow (replace plan).
- **Types:** `onClick: () => void`, `loading?: boolean`.
- **Props:** `onClick`, `loading`. Visibility from parent (plan !== null).

### Link/CTA to Shopping list

- **Description:** Link or button to `/shopping-list`. Shown when plan exists so user can view the shopping list.
- **Main elements:** Link (Astro or React Router) to `/shopping-list`.
- **Props:** Optional `children` or label "Shopping list".

### EmptyState (no plan, empty inventory)

- **Description:** When there is no plan and no products: message directing user to add products; CTA to `/` (inventory).
- **Main elements:** Paragraph, Link/Button to `/`.
- **Props:** None.

### EmptyStateWithInventory (no plan, has products)

- **Description:** When there is no plan but inventory has items: empty state with "Generate Meal Plan" enabled (button is visible in header area).
- **Main elements:** Short message (e.g. "Generate your weekly meal plan based on your inventory."), Generate button already in header.
- **Props:** None.

### LoadingState

- **Description:** Full-page or prominent loading indicator during generation. Text: "Generating your meal plan…". Disable Generate and Regenerate buttons.
- **Main elements:** Spinner/skeleton and text.
- **Props:** None or `message?: string`.

### ErrorState

- **Description:** Shown when POST `/api/meal-plan` returns 502/503/504 or 429. For 502/503/504: message "Unable to generate meal plan. Please try again in a moment." and Retry button; do not expose technical details. For 429: "Too many requests, please try again later" and disable retry briefly (e.g. 30–60 seconds). Previous plan (if any) remains visible during error.
- **Main elements:** Alert or div with message, Button "Retry" (disabled for 429 cooldown).
- **Handled events:** Retry click: call generate again (when not in cooldown).
- **Types:** `error: { kind: 'retry' | 'rate_limit'; message: string } | null`, `onRetry: () => void`, `retryDisabled?: boolean`.
- **Props:** `error`, `onRetry`, `retryDisabled`.

### MealPlanTable

- **Description:** Displays 7-day plan: columns = days, rows = breakfast, lunch, dinner. Each cell: dish name, ingredients with quantities (e.g. "Tomatoes - 500g"), preparation instructions (3–5 bullet points). Responsive: on narrow viewports use stacked/accordion or horizontal scroll; touch targets ≥44×44px, text ≥14px. Accessible: row/column headers for screen readers.
- **Main elements:** Table (or responsive equivalent: cards per day with expandable meals). Table: thead with day names/dates, tbody with rows breakfast/lunch/dinner; each cell contains dish name, list of ingredients, list of instructions (bullets). Use semantic th/scope for headers.
- **Handled events:** None (display only).
- **Types:** `mealPlan: MealPlanDto` (days array; each day has date, breakfast, lunch, dinner; each meal has name, ingredients[], instructions[]).
- **Props:** `mealPlan: MealPlanDto`. Optional: `maxHeight` for inner scroll if cells are tall.

### MealCellContent (optional subcomponent)

- **Description:** Renders one meal: name, ingredients list (name - quantity unit), instructions as bullet list. Text wrapping; no full-page horizontal scroll.
- **Main elements:** Heading or span (dish name), ul (ingredients), ul (instructions).
- **Types:** `meal: MealDto`.
- **Props:** `meal: MealDto`.

## 5. Types

- **From `src/types.ts`:** `MealPlanDto`, `MealPlanDayDto`, `MealDto`, `MealIngredientDto`, `ShoppingListDto`, `ShoppingListItemDto`, `GenerateMealPlanCommand`, `GenerateMealPlanResponse`, `MealPlanProductInput`.
- **SessionStorage:** Persist object `{ mealPlan: MealPlanDto; shoppingList: ShoppingListDto }` under key `meal-planner-plan`. Hydrate on mount; overwrite when new plan is generated.
- **Error state:** `{ kind: 'retry' | 'rate_limit'; message: string }` — retry for 502/503/504, rate_limit for 429 with cooldown.
- **Request:** POST `/api/meal-plan` body can be `{}` (server fetches products) or `{ products: MealPlanProductInput[] }` if client already has list; optional `startDate` (MVP: omit, use API default).

## 6. State Management

- **State:** `mealPlan: MealPlanDto | null`, `shoppingList: ShoppingListDto | null`, `hasProducts: boolean` (or productsCount), `loading: boolean`, `error: { kind, message } | null`, optional `retryCooldownUntil: number` (timestamp) for 429.
- **Persistence:** On successful generate/regenerate, write `{ mealPlan, shoppingList }` to sessionStorage key `meal-planner-plan`. On mount, read and set state; if invalid or missing, treat as no plan.
- **Products check:** On mount (and optionally when navigating from inventory), call GET `/api/products` with limit=1 or small limit to determine if inventory is empty; set `hasProducts`. Alternatively use full list and pass as `products` in POST to avoid server fetch (same outcome).
- **Custom hook (optional):** `useMealPlanStorage()` that returns `{ mealPlan, shoppingList, setMealPlanAndList, hydrate }` and syncs to sessionStorage. Or keep logic in MealPlanView.
- **401:** On any API call, redirect to login; do not store plan on 401.

## 7. API Integration

- **GET /api/products:** Used to know if inventory has items (e.g. limit=1). Response: `{ data: ProductDto[], meta }`. If `data.length === 0`, disable Generate and show tooltip. 401 → redirect.
- **POST /api/meal-plan:** Body: `GenerateMealPlanCommand` — `{}` or `{ products?: MealPlanProductInput[], startDate?: string }`. If omitted, server fetches user products; if empty, returns 422. Response (200): `GenerateMealPlanResponse` = `{ mealPlan: MealPlanDto, shoppingList: ShoppingListDto }`. Errors: 400 invalid input, 401 unauthorized, 422 empty inventory, 429 too many requests, 502/503/504 AI failure/timeout, 500 server error. Map 502/503/504 to retry message; 429 to rate_limit message and cooldown; do not expose technical details.

## 8. User Interactions

- **Load page:** Hydrate plan and shopping list from sessionStorage; fetch products to set hasProducts; show empty state (with or without CTA to inventory), loading, error, or table accordingly.
- **Click "Generate Meal Plan" (enabled):** Set loading, POST `/api/meal-plan`, on success save to state and sessionStorage, show table and Regenerate + link to shopping list; on 502/503/504 show ErrorState with Retry; on 429 show message and disable retry for a period.
- **Click "Regenerate All":** Same as generate; replace plan and list; no confirmation.
- **Click "Retry":** Same as generate (when not in cooldown).
- **Click link to Shopping list:** Navigate to `/shopping-list`.
- **401:** Redirect to login.

## 9. Conditions and Validation

- **Inventory empty:** When GET products returns empty list, disable "Generate Meal Plan" and show tooltip "Add products to inventory first". Show empty state with CTA to `/`.
- **No plan, has products:** Show empty state with "Generate Meal Plan" enabled.
- **Plan exists:** Show MealPlanTable, Regenerate button, and link to Shopping list.
- **Loading:** Show LoadingState; disable generate/regenerate buttons.
- **Error:** Show ErrorState; for 429 disable Retry for cooldown; previous plan remains visible.
- **SessionStorage:** On load, parse `meal-planner-plan`; if valid structure (mealPlan.days, shoppingList.items/grouped), use it; else null.

## 10. Error Handling

- **502 / 503 / 504:** Message: "Unable to generate meal plan. Please try again in a moment." Show Retry button; do not expose technical details. Keep previous plan visible if any.
- **429:** Message: "Too many requests, please try again later." Disable Retry button for a short period (e.g. 30–60 s). Optionally show countdown.
- **422:** Server returns when inventory empty and server fetches; client should already disable button when hasProducts is false. If client sends empty products array, API returns 422—avoid sending empty array when server fetch is used.
- **401:** Redirect to login with optional message "Session expired or invalid. Please sign in again."
- **500:** Generic message; optionally show Retry. Log for debugging.

## 11. Implementation Steps

1. Create `src/pages/meal-plan.astro`: use root layout with nav; mount MealPlanView (React) with `client:load`.
2. Implement MealPlanView: state (mealPlan, shoppingList, hasProducts, loading, error, retryCooldownUntil); on mount hydrate from sessionStorage (key `meal-planner-plan`), fetch GET `/api/products` (limit=1 or full) to set hasProducts; implement generate function (POST `/api/meal-plan`), success → set state and sessionStorage, failure → set error by status.
3. Implement GenerateMealPlanButton with Tooltip; disabled when !hasProducts; onClick triggers generate; disabled when loading.
4. Implement RegenerateAllButton; visible when mealPlan !== null; same onClick as generate.
5. Add link/CTA to `/shopping-list` (visible when plan exists).
6. Implement EmptyState (no plan + !hasProducts): message + link to `/`.
7. Implement EmptyStateWithInventory (no plan + hasProducts): short message; button is in header.
8. Implement LoadingState: full-page or prominent "Generating your meal plan…"; show when loading.
9. Implement ErrorState: message by error.kind (retry vs rate_limit), Retry button (disabled during 429 cooldown); onRetry calls generate again.
10. Implement MealPlanTable: accept mealPlan, render 7 columns (days) and 3 rows (breakfast, lunch, dinner); each cell renders MealCellContent (dish name, ingredients with quantity+unit, instructions as bullets). Use semantic table headers; responsive layout (stacked or horizontal scroll on small screens); min touch target 44px, text ≥14px.
11. Optional: extract MealCellContent for clarity; ensure long ingredient/instruction lists wrap or scroll inside cell without full-page horizontal scroll.
12. Wire sessionStorage: on generate success write `{ mealPlan, shoppingList }`; on mount read and parse; validate structure before using.
13. Test: load with no plan, with stored plan; generate with products; regenerate; 429 and 502/503/504 handling; 401 redirect; link to shopping list; accessibility (headers, focus).
