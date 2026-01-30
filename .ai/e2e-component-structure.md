# E2E Component Structure and data-test-id Map

Structure and dependencies of key components for test-plan E2E scenarios (Section 3.4 & 4.x).  
All `data-test-id` values are listed; use them in Playwright/Cypress selectors.

---

## 1. Page → Layout → Global Components

```
+------------------+
| Layout.astro     |
|  - AppNav        |  data-test-id: nav
|  - <slot />      |  (page content)
|  - ToasterMount  |  data-test-id: toaster-mount
+--------+---------+
         |
         +-- index.astro      → InventoryView
         +-- login.astro      → AuthFormContainer
         +-- meal-plan.astro  → MealPlanView
         +-- shopping-list.astro → ShoppingListView
```

---

## 2. Auth E2E (Scenarios A1–A9)

**Relevant:** Login page, register, redirect after login, logout, protected routes.

```
login.astro
  └── main [data-test-id="login-page"]
        └── AuthFormContainer [data-test-id="auth-form-container"]
              ├── h1 (Sign in / Create account)
              ├── ModeSwitcher [data-test-id="auth-mode-switcher"]
              │     ├── TabsList
              │     ├── TabsTrigger "Sign in"     [data-test-id="auth-tab-signin"]
              │     └── TabsTrigger "Create account" [data-test-id="auth-tab-register"]
              ├── SignInForm [data-test-id="signin-form"]  (when mode=signin)
              │     ├── input email    [data-test-id="signin-email"]
              │     ├── input password [data-test-id="signin-password"]
              │     └── button submit  [data-test-id="signin-submit"]
              ├── CreateAccountForm [data-test-id="register-form"]  (when mode=register)
              │     ├── input email         [data-test-id="register-email"]
              │     ├── input password      [data-test-id="register-password"]
              │     ├── input confirm       [data-test-id="register-confirm-password"]
              │     └── button submit       [data-test-id="register-submit"]
              └── InlineErrorArea [data-test-id="auth-error"]
```

**AppNav (present on all authenticated pages):**

```
AppNav [data-test-id="nav"]
  ├── a "Inventory"   [data-test-id="nav-link-inventory"]
  ├── a "Meal plan"   [data-test-id="nav-link-meal-plan"]
  ├── a "Shopping list" [data-test-id="nav-link-shopping-list"]
  └── Button "Logout" [data-test-id="nav-logout"]
```

**data-test-id summary — Auth**

| Element / action              | data-test-id              |
|-----------------------------|---------------------------|
| Login page main             | login-page                |
| Auth form container         | auth-form-container       |
| Mode tabs container         | auth-mode-switcher        |
| Sign in tab                 | auth-tab-signin           |
| Create account tab          | auth-tab-register         |
| Sign-in form                | signin-form               |
| Sign-in email input         | signin-email              |
| Sign-in password input      | signin-password           |
| Sign-in submit button       | signin-submit             |
| Register form               | register-form             |
| Register email input        | register-email            |
| Register password input     | register-password         |
| Register confirm input      | register-confirm-password |
| Register submit button      | register-submit           |
| Auth error message area     | auth-error                |
| Main navigation             | nav                       |
| Nav link Inventory          | nav-link-inventory        |
| Nav link Meal plan          | nav-link-meal-plan        |
| Nav link Shopping list      | nav-link-shopping-list    |
| Logout button               | nav-logout                |

---

## 3. Inventory E2E (Scenarios I1–I10)

**Relevant:** List products, search, add/edit/delete product, expiration indicators.

```
index.astro → Layout → InventoryView
  └── main [data-test-id="inventory-page"]
        ├── PageHeader "Inventory" [data-test-id="inventory-header"]
        ├── SearchInput [data-test-id="inventory-search"]
        │     ├── input [data-test-id="inventory-search-input"]
        │     └── button clear [data-test-id="inventory-search-clear"]
        ├── Button "Add product" [data-test-id="inventory-add-product"]
        ├── "Loading…" (when loading) [data-test-id="inventory-loading"]
        ├── EmptyState [data-test-id="inventory-empty-state"]
        │     └── Button "Add product" [data-test-id="inventory-empty-add-product"]
        ├── NoSearchResultsState [data-test-id="inventory-no-search-results"]
        │     └── Button "Clear search" [data-test-id="inventory-clear-search"]
        ├── ProductTable [data-test-id="inventory-product-table"]
        │     ├── TableRow per product [data-test-id="product-row"] ( + data-product-id for row)
        │     │     ├── ExpirationIndicator [data-test-id="product-expiration-indicator"]
        │     │     ├── Button "Edit" [data-test-id="product-edit"]
        │     │     └── Button "Delete" [data-test-id="product-delete"]
        │     └── (mobile card list: same actions per li [data-test-id="product-row"])
        ├── ProductFormModal [data-test-id="product-form-modal"]
        │     ├── dialog
        │     ├── Button close [data-test-id="product-form-modal-close"]
        │     ├── ProductForm
        │     │     ├── input name [data-test-id="product-form-name"]
        │     │     ├── input quantity [data-test-id="product-form-quantity"]
        │     │     ├── select unit [data-test-id="product-form-unit"]
        │     │     ├── input expiration [data-test-id="product-form-expiration-date"]
        │     │     ├── input category [data-test-id="product-form-category"]
        │     │     ├── Button Cancel [data-test-id="product-form-cancel"]
        │     │     └── Button Submit [data-test-id="product-form-submit"]
        │     └── "Saving…" [data-test-id="product-form-saving"]
        └── DeleteProductDialog [data-test-id="delete-product-dialog"]
              ├── Button Cancel [data-test-id="delete-product-dialog-cancel"]
              └── Button Delete [data-test-id="delete-product-dialog-confirm"]
```

**data-test-id summary — Inventory**

| Element / action           | data-test-id                    |
|---------------------------|----------------------------------|
| Inventory page main       | inventory-page                  |
| Page header               | inventory-header                |
| Search wrapper            | inventory-search                |
| Search input              | inventory-search-input          |
| Search clear button       | inventory-search-clear          |
| Add product button        | inventory-add-product           |
| Loading message           | inventory-loading               |
| Empty state               | inventory-empty-state           |
| Empty state Add product   | inventory-empty-add-product     |
| No search results         | inventory-no-search-results     |
| Clear search button        | inventory-clear-search           |
| Product table             | inventory-product-table         |
| Product row (table/card)   | product-row                     |
| Product expiration        | product-expiration-indicator    |
| Edit product button       | product-edit                    |
| Delete product button     | product-delete                  |
| Add/Edit modal            | product-form-modal               |
| Modal close               | product-form-modal-close        |
| Form name                 | product-form-name               |
| Form quantity             | product-form-quantity           |
| Form unit                 | product-form-unit               |
| Form expiration date      | product-form-expiration-date    |
| Form category             | product-form-category           |
| Form cancel               | product-form-cancel             |
| Form submit               | product-form-submit             |
| Form saving message       | product-form-saving             |
| Delete dialog             | delete-product-dialog           |
| Delete dialog cancel      | delete-product-dialog-cancel    |
| Delete dialog confirm     | delete-product-dialog-confirm   |

---

## 4. Meal Plan E2E (Scenarios M1–M10)

**Relevant:** Generate (disabled when empty), loading, table, regenerate, error, link to shopping list.

```
meal-plan.astro → Layout → MealPlanView
  └── main [data-test-id="meal-plan-page"]
        ├── PageHeader "Meal Plan" [data-test-id="meal-plan-header"]
        ├── section prompt [data-test-id="meal-plan-prompt-section"]
        │     ├── label
        │     └── textarea [data-test-id="meal-plan-prompt"]
        ├── GenerateMealPlanButton [data-test-id="meal-plan-generate"]
        ├── RegenerateAllButton [data-test-id="meal-plan-regenerate"]
        ├── a "Shopping list" [data-test-id="meal-plan-link-shopping-list"]
        ├── LoadingState [data-test-id="meal-plan-loading"]
        ├── ErrorState [data-test-id="meal-plan-error"]
        │     └── Button "Retry" [data-test-id="meal-plan-retry"]
        ├── MealPlanEmptyState [data-test-id="meal-plan-empty"]
        │     └── a "Go to Inventory" [data-test-id="meal-plan-empty-go-to-inventory"]
        ├── MealPlanEmptyStateWithInventory [data-test-id="meal-plan-empty-with-inventory"]
        └── MealPlanTable [data-test-id="meal-plan-table"]
              └── MealCellContent (per cell) [data-test-id="meal-cell-content"]
```

**data-test-id summary — Meal Plan**

| Element / action              | data-test-id                         |
|------------------------------|--------------------------------------|
| Meal plan page main          | meal-plan-page                       |
| Page header                  | meal-plan-header                     |
| Prompt section               | meal-plan-prompt-section             |
| Prompt textarea              | meal-plan-prompt                     |
| Generate Meal Plan button    | meal-plan-generate                   |
| Regenerate All button        | meal-plan-regenerate                 |
| Shopping list link            | meal-plan-link-shopping-list         |
| Loading state                | meal-plan-loading                    |
| Error state                  | meal-plan-error                      |
| Retry button                 | meal-plan-retry                      |
| Empty (no inventory)         | meal-plan-empty                      |
| Go to Inventory link         | meal-plan-empty-go-to-inventory      |
| Empty with inventory         | meal-plan-empty-with-inventory       |
| Meal plan table              | meal-plan-table                      |
| Meal cell content            | meal-cell-content                    |

---

## 5. Shopping List E2E (Scenarios S1–S4)

**Relevant:** No plan state, loading, grouped list, refresh, empty list.

```
shopping-list.astro → Layout → ShoppingListView
  └── main [data-test-id="shopping-list-page"]
        ├── PageHeader "Shopping List" [data-test-id="shopping-list-header"]
        ├── NoPlanState [data-test-id="shopping-list-no-plan"]
        │     ├── a "Go to Meal plan" [data-test-id="shopping-list-no-plan-go-to-meal-plan"]
        │     └── a "Go to Inventory" [data-test-id="shopping-list-no-plan-go-to-inventory"]
        ├── "Loading shopping list…" [data-test-id="shopping-list-loading"]
        ├── Error message (inline) [data-test-id="shopping-list-error"]
        ├── Button "Refresh list" [data-test-id="shopping-list-refresh"]
        ├── EmptyListState [data-test-id="shopping-list-empty"]
        └── GroupedShoppingList [data-test-id="shopping-list-grouped"]
              └── CategoryGroup (per category) [data-test-id="shopping-list-category"]
                    ├── h3 category name
                    └── ShoppingListItemRow [data-test-id="shopping-list-item"]
```

**data-test-id summary — Shopping List**

| Element / action        | data-test-id                               |
|-------------------------|--------------------------------------------|
| Shopping list page main | shopping-list-page                         |
| Page header             | shopping-list-header                       |
| No plan state           | shopping-list-no-plan                      |
| Go to Meal plan link    | shopping-list-no-plan-go-to-meal-plan      |
| Go to Inventory link    | shopping-list-no-plan-go-to-inventory      |
| Loading message         | shopping-list-loading                      |
| Error message           | shopping-list-error                         |
| Refresh list button     | shopping-list-refresh                      |
| Empty list state        | shopping-list-empty                        |
| Grouped list section    | shopping-list-grouped                      |
| Category section        | shopping-list-category                      |
| Shopping list item row  | shopping-list-item                         |

---

## 6. Dependency Overview (key components only)

```
Layout.astro
  ├── AppNav
  └── ToasterMount

Auth:     AuthFormContainer → ModeSwitcher, SignInForm, CreateAccountForm, InlineErrorArea
Inventory: InventoryView → PageHeader, SearchInput, ProductTable, ProductFormModal, DeleteProductDialog,
           EmptyState, NoSearchResultsState
           ProductTable → ExpirationIndicator
           ProductFormModal → ProductForm

Meal plan: MealPlanView → PageHeader, GenerateMealPlanButton, RegenerateAllButton,
           MealPlanTable, LoadingState, ErrorState, MealPlanEmptyState, MealPlanEmptyStateWithInventory
           MealPlanTable → MealCellContent

Shopping: ShoppingListView → PageHeader, NoPlanState, EmptyListState, GroupedShoppingList
          GroupedShoppingList → CategoryGroup → ShoppingListItemRow
```

---

## 7. Usage in E2E (Playwright example)

Playwright is configured with `testIdAttribute: "data-test-id"` so `page.getByTestId("...")` matches these attributes.

```ts
// Auth: submit sign-in
await page.getByTestId("signin-email").fill("user@example.com");
await page.getByTestId("signin-password").fill("password");
await page.getByTestId("signin-submit").click();

// Inventory: add product
await page.getByTestId("inventory-add-product").click();
await page.getByTestId("product-form-name").fill("Milk");
await page.getByTestId("product-form-submit").click();

// Meal plan: generate
await page.getByTestId("meal-plan-generate").click();
await page.getByTestId("meal-plan-table").waitFor({ state: "visible" });

// Shopping list: open from meal plan
await page.getByTestId("meal-plan-link-shopping-list").click();
await page.getByTestId("shopping-list-grouped").waitFor({ state: "visible" });
```
