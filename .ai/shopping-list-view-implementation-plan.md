# View Implementation Plan: Shopping List

## 1. Overview

The Shopping List view shows missing ingredients for the current meal plan, grouped by category. Data comes from client state and sessionStorage (same key as meal plan: `meal-planner-plan`). When the user has changed inventory and a plan exists, the client can call POST `/api/shopping-list` with the current meal plan to get an updated list and then update state and sessionStorage. The list is read-only in MVP (no edit/delete of list items). Categories are shown in alphabetical order; uncategorized items appear under "Other" (last). The view is only rendered on this route (not on the meal plan page).

## 2. View Routing

- **Path:** `/shopping-list`
- **Astro page:** `src/pages/shopping-list.astro`
- **Protected:** Yes. Unauthenticated users are redirected to `/login`.
- **Layout:** Root layout with navigation (Inventory, Meal plan, Shopping list, Logout).

## 3. Component Structure

```
ShoppingListPage (Astro page)
└── ShoppingListView (React, client:load)
    ├── PageHeader
    ├── NoPlanState (no meal plan: message + link to /meal-plan and /)
    ├── EmptyListState (plan exists, list empty: "Great! You have everything you need for this meal plan.")
    ├── GroupedShoppingList (category sections; "Other" last)
    │   └── CategoryGroup (heading + item rows)
    │       └── ShoppingListItemRow (name, quantity, unit)
```

## 4. Component Details

### ShoppingListView (container)

- **Description:** Top-level container that hydrates meal plan and shopping list from sessionStorage. If no plan, show NoPlanState. If plan exists but list is missing or stale, optionally call POST `/api/shopping-list` with current meal plan and current inventory (server fetches inventory) to refresh list, then update state and sessionStorage. Renders header and conditional content: NoPlanState, EmptyListState, or GroupedShoppingList.
- **Main elements:** `main`, PageHeader, conditional NoPlanState | EmptyListState | GroupedShoppingList.
- **Handled events:** Mount: read sessionStorage key `meal-planner-plan`; if mealPlan present and shoppingList present, use it; if mealPlan present but list missing or client wants refresh, call POST `/api/shopping-list` with mealPlan, then update state and sessionStorage. 401 → redirect to login. Optional: when this view is shown after inventory changes (e.g. user navigates from Inventory), call POST `/api/shopping-list` to recompute and re-render.
- **Validation:** None at container; API validates mealPlan.
- **Types:** Uses `MealPlanDto`, `ShoppingListDto`, `ComputeShoppingListCommand`, `ComputeShoppingListResponse`. State: `mealPlan: MealPlanDto | null`, `shoppingList: ShoppingListDto | null`, `loading: boolean` (optional, for refresh), `error: string | null` (optional).
- **Props:** None.

### PageHeader

- **Description:** Page title (e.g. "Shopping List").
- **Main elements:** `h1`.
- **Props:** Optional `title?: string`.

### NoPlanState

- **Description:** Shown when there is no meal plan in state (sessionStorage empty or invalid). Short message directing user to generate a plan from `/meal-plan` or add products from `/`.
- **Main elements:** Paragraph, Link to `/meal-plan`, Link to `/` (inventory).
- **Handled events:** None (links only).
- **Types:** None.
- **Props:** None.

### EmptyListState

- **Description:** Shown when a plan exists but the shopping list is empty (all ingredients covered by inventory). Message: "Great! You have everything you need for this meal plan."
- **Main elements:** Paragraph.
- **Types:** None.
- **Props:** None.

### GroupedShoppingList

- **Description:** Renders shopping list grouped by category. Categories in alphabetical order; uncategorized items under "Other" (last). Each category is a CategoryGroup (heading + list of items). Accessible: use headings and list structure for screen readers.
- **Main elements:** Section or div; for each category key (sorted, with "Other" last), render CategoryGroup. Use `h2` or heading level for category name; list (`ul`/`li` or role="list") for items.
- **Handled events:** None (display only).
- **Types:** `shoppingList: ShoppingListDto` — use `grouped: Record<string, ShoppingListItemDto[]>`; sort keys alphabetically but place "Other" (or "Miscellaneous") last.
- **Props:** `shoppingList: ShoppingListDto`.

### CategoryGroup

- **Description:** One category section: heading (category name) and list of ShoppingListItemRow. Category key from API (e.g. "Dairy", "Other"); items within category can be listed in alphabetical order (optional per PRD).
- **Main elements:** Heading (h2 or similar), ul/ol or div with role="list"; each child ShoppingListItemRow.
- **Handled events:** None.
- **Types:** `categoryName: string`, `items: ShoppingListItemDto[]`.
- **Props:** `categoryName: string`, `items: ShoppingListItemDto[]`.

### ShoppingListItemRow

- **Description:** One row: item name and required quantity (e.g. "Tomatoes - 500g" or "name — quantity unit"). Read-only; no edit/delete in MVP.
- **Main elements:** List item (li) or table row; span or div for name; span or div for quantity and unit (formatted e.g. "500g", "3 pieces").
- **Handled events:** None.
- **Types:** `item: ShoppingListItemDto` — `{ name, quantity, unit, category }`.
- **Props:** `item: ShoppingListItemDto`.

## 5. Types

- **From `src/types.ts`:** `ShoppingListDto` (`items: ShoppingListItemDto[]`, `grouped: Record<string, ShoppingListItemDto[]>`), `ShoppingListItemDto` (`name`, `quantity`, `unit`, `category`), `MealPlanDto`, `ComputeShoppingListCommand` (`mealPlan: MealPlanDto`), `ComputeShoppingListResponse` (same shape as `ShoppingListDto`).
- **SessionStorage:** Same key as meal plan: `meal-planner-plan`. Stored object: `{ mealPlan: MealPlanDto, shoppingList: ShoppingListDto }`. Hydrate on mount; when list is refreshed via POST `/api/shopping-list`, update shoppingList in state and sessionStorage (overwrite same key with updated shoppingList).
- **Category order:** Sort `Object.keys(grouped)` alphabetically, but place "Other" (or "Miscellaneous") last. API returns `grouped` with category keys; uncategorized items are under "Other" or similar.

## 6. State Management

- **State:** `mealPlan: MealPlanDto | null`, `shoppingList: ShoppingListDto | null`, optional `loading: boolean`, optional `error: string | null`.
- **Persistence:** On mount, read sessionStorage key `meal-planner-plan`; parse and set mealPlan and shoppingList. When POST `/api/shopping-list` returns, update shoppingList in state and write back to sessionStorage (full object `{ mealPlan, shoppingList }`) so meal plan page and this page stay in sync.
- **Refresh flow (optional):** When user lands on this page and a plan exists, client can always call POST `/api/shopping-list` with current mealPlan to get list computed against current inventory; then update state and sessionStorage. This matches UI plan: "when inventory changes and a plan exists, client calls POST /api/shopping-list with current meal plan and updates state and sessionStorage, then re-renders." So on mount: if mealPlan exists, call POST with mealPlan to get fresh list; if no mealPlan, show NoPlanState.
- **Custom hook (optional):** `useShoppingListStorage()` that hydrates from sessionStorage and optionally exposes `refreshList(mealPlan)` that calls API and updates storage. Or keep logic in ShoppingListView.
- **401:** Redirect to login.

## 7. API Integration

- **POST /api/shopping-list:** Body: `ComputeShoppingListCommand` = `{ mealPlan: MealPlanDto }`. Meal plan must have `days` array; each day has `date`, `breakfast`, `lunch`, `dinner`; each meal has `name`, `ingredients`, `instructions`. Response (200): `ComputeShoppingListResponse` = `ShoppingListDto` (`items`, `grouped`). Errors: 400 invalid or missing mealPlan, 401 unauthorized, 500 server error. Server uses current user inventory (from DB) to compute missing ingredients; client does not send inventory.
- **Request type:** `ComputeShoppingListCommand` from `src/types.ts`. **Response type:** `ComputeShoppingListResponse` (same as `ShoppingListDto`).
- **Usage:** On mount, if mealPlan is present (from sessionStorage), call POST with `{ mealPlan }`; on success set shoppingList and persist to sessionStorage; on 401 redirect; on 400/500 show optional error or keep previous list.

## 8. User Interactions

- **Load page:** Hydrate mealPlan and shoppingList from sessionStorage. If no mealPlan, show NoPlanState with links to `/meal-plan` and `/`. If mealPlan exists, call POST `/api/shopping-list` with mealPlan to get fresh list; on success update state and sessionStorage and show GroupedShoppingList or EmptyListState (if items.length === 0). If list already in storage and skip refetch on mount, still show list; optional "Refresh" button could call POST again.
- **Click link to Meal plan:** Navigate to `/meal-plan`.
- **Click link to Inventory:** Navigate to `/`.
- **No edit/delete:** List items are read-only; no handlers for editing or removing items from the list in MVP.

## 9. Conditions and Validation

- **No plan:** When sessionStorage has no valid meal plan (or key missing), show NoPlanState. Do not call POST `/api/shopping-list` without a valid mealPlan.
- **Plan exists:** When mealPlan is present, call POST `/api/shopping-list` with mealPlan (on mount or when user navigates here) to get list; then show EmptyListState if `items.length === 0`, else GroupedShoppingList.
- **Category order:** Display categories from `grouped` in alphabetical order, with "Other" (or "Miscellaneous") last. Items within category: optional alphabetical by name (per PRD).
- **Accessibility:** Use semantic headings (e.g. h2) for category names and list structure (ul/li or role="list") for items so screen readers can navigate.

## 10. Error Handling

- **401:** Redirect to `/login` with optional "Session expired or invalid. Please sign in again."
- **400:** Invalid or missing mealPlan; do not call with empty or malformed plan. If API returns 400, show optional message and NoPlanState or keep previous list.
- **500:** Optional generic message; keep previous list if any; log for debugging.
- **Network error:** Optional message; retry or show NoPlanState depending on product decision.

## 11. Implementation Steps

1. Create `src/pages/shopping-list.astro`: use root layout with nav; mount ShoppingListView (React) with `client:load`.
2. Implement ShoppingListView: on mount read sessionStorage key `meal-planner-plan`; parse and set mealPlan and shoppingList. If mealPlan is null or invalid, set state to show NoPlanState. If mealPlan exists, call POST `/api/shopping-list` with body `{ mealPlan }`; on success set shoppingList (and optionally update sessionStorage with new list); on 401 redirect; on error optionally set error state.
3. Implement NoPlanState: message + link to `/meal-plan` and link to `/`. Show when mealPlan is null.
4. Implement EmptyListState: message "Great! You have everything you need for this meal plan." Show when mealPlan exists and shoppingList.items.length === 0.
5. Implement GroupedShoppingList: accept shoppingList; get category keys from shoppingList.grouped; sort alphabetically but put "Other" (or "Miscellaneous") last; for each category render CategoryGroup with categoryName and items.
6. Implement CategoryGroup: accept categoryName and items; render heading (h2) with category name; render list of ShoppingListItemRow for each item. Use ul/li or role="list" for accessibility.
7. Implement ShoppingListItemRow: accept item (ShoppingListItemDto); display name and formatted quantity (e.g. "500g", "3 pieces"). Read-only.
8. Wire sessionStorage: when POST `/api/shopping-list` succeeds, update shoppingList in state and write full object `{ mealPlan, shoppingList }` to sessionStorage so meal plan page and shopping list stay in sync.
9. Optional: add loading indicator while POST is in progress; optional "Refresh list" button that re-calls POST with current mealPlan.
10. Test: load with no plan (NoPlanState); load with plan and empty list (EmptyListState); load with plan and items (GroupedShoppingList); category order ("Other" last); 401 redirect; accessibility (headings, list structure).
