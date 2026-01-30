# Component Structure and Dependencies (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PAGES (Astro)                                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ index.astro ──────► Layout.astro ──────► AppNav, ToasterMount                    │
│                         │                                                         │
│                         └── slot: InventoryView (client:load)                     │
│                                                                                  │
│ meal-plan.astro ──► Layout.astro ──────► AppNav, ToasterMount                    │
│                         │                                                         │
│                         └── slot: MealPlanView (client:load)                      │
│                                                                                  │
│ shopping-list.astro ► Layout.astro ────► AppNav, ToasterMount                    │
│                         │                                                         │
│                         └── slot: ShoppingListView (client:load)                 │
│                                                                                  │
│ login.astro ──────► Layout.astro ──────► AppNav, ToasterMount                    │
│                         │                                                         │
│                         └── slot: AuthFormContainer (client:load)                 │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ LAYOUT & ROOT COMPONENTS                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Layout.astro                                                                     │
│   ├── AppNav.tsx ───────────────────► @/db/supabase.browser, ui/button            │
│   └── ToasterMount.tsx ─────────────► ui/sonner                                 │
│         └── Toaster (from sonner)                                                │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ FEATURE: INVENTORY (InventoryView = container)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ InventoryView                                                                    │
│   ├── PageHeader (title)                                                         │
│   ├── SearchInput                                                               │
│   ├── Button (Add product)                                                       │
│   ├── EmptyState (when no products)                                             │
│   ├── NoSearchResultsState (when search, no results)                             │
│   ├── ProductTable                                                              │
│   │     ├── ui/table (Table, TableBody, TableCell, TableHead, TableHeader, Row)  │
│   │     ├── Button (Edit, Delete)                                               │
│   │     └── ExpirationIndicator                                                 │
│   ├── ProductFormModal                                                          │
│   │     ├── ProductForm (Input, Label, Button)                                  │
│   │     └── Button (Cancel, Submit)                                             │
│   └── DeleteProductDialog                                                       │
│         └── Button (Cancel, Delete)                                             │
│                                                                                 │
│ Dependencies: @/lib/auth-fetch, @/types (ProductDto, PaginatedResponse)         │
│               ui/button (EmptyState, NoSearchResultsState, ProductTable, etc.)  │
│               ui/input, ui/label (ProductForm, SearchInput)                      │
│               @/lib/utils (cn) in ProductForm, ProductTable, SearchInput, etc.  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ FEATURE: MEAL PLAN (MealPlanView = container)                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MealPlanView                                                                     │
│   ├── PageHeader (from inventory/)                                               │
│   ├── GenerateMealPlanButton ─────────► ui/button                                │
│   ├── RegenerateAllButton ───────────► ui/button                                │
│   ├── MealPlanEmptyState ────────────► ui/button                                │
│   ├── MealPlanEmptyStateWithInventory (no deps)                                  │
│   ├── LoadingState (no deps)                                                     │
│   ├── ErrorState ───────────────────► ui/button                                │
│   └── MealPlanTable                                                              │
│         ├── ui/table (Table, TableBody, TableCell, TableHead, TableHeader, Row)  │
│         └── MealCellContent (@/types MealDto)                                    │
│                                                                                  │
│ Dependencies: @/lib/auth-fetch, hooks/useMealPlanStorage, inventory/PageHeader   │
│               @/types (GenerateMealPlanResponse, PaginatedResponse, ProductDto)  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ FEATURE: SHOPPING LIST (ShoppingListView = container)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ShoppingListView                                                                 │
│   ├── PageHeader (from inventory/)                                               │
│   ├── Button (Refresh list)                                                      │
│   ├── NoPlanState (no plan yet)                                                  │
│   ├── EmptyListState (plan exists, list empty)                                   │
│   └── GroupedShoppingList                                                        │
│         └── CategoryGroup (per category)                                         │
│               └── ShoppingListItemRow (per item)                                 │
│                                                                                  │
│ Dependencies: @/lib/auth-fetch, hooks/useMealPlanStorage, inventory/PageHeader    │
│               ui/button, @/types (ComputeShoppingListCommand, ComputeShoppingListResponse) │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ FEATURE: AUTH (AuthFormContainer = container)                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ AuthFormContainer                                                                 │
│   ├── ModeSwitcher ────────────────► ui/tabs (Tabs, TabsList, TabsTrigger)       │
│   ├── SignInForm (mode=signin) ────► ui/button, ui/input, ui/label               │
│   ├── CreateAccountForm (mode=create) ► ui/button, ui/input, ui/label            │
│   └── InlineErrorArea                                                            │
│                                                                                  │
│ Dependencies: @/db/supabase.browser, @/lib/auth-errors, @/lib/auth-validation     │
│               @/types (AuthMode, isAllowedRedirect)                               │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ SHARED HOOKS                                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ hooks/useMealPlanStorage                                                         │
│   └── @/types (MealPlanDto, ShoppingListDto)                                     │
│   Used by: MealPlanView, ShoppingListView                                        │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ UI PRIMITIVES (Shadcn) – used by feature components                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ui/button.tsx ──────► @/lib/utils (cn)                                          │
│ ui/input.tsx ───────► @/lib/utils (cn)                                          │
│ ui/label.tsx ───────► @/lib/utils (cn)                                          │
│ ui/table.tsx ───────► @/lib/utils (cn)                                          │
│ ui/tabs.tsx ────────► @/lib/utils (cn)                                          │
│ ui/tooltip.tsx ─────► @/lib/utils (cn)                                          │
│ ui/sonner.tsx ──────► @/lib/utils (cn)                                          │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ LIB & DB (non-component dependencies)                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Components use:                                                                  │
│   @/lib/auth-fetch ─────────────► @/db/supabase.browser                          │
│   @/lib/auth-errors             (mapSignInError, mapSignUpError)                  │
│   @/lib/auth-validation         (getRegisterValidationError, getSignInValidationError) │
│   @/lib/utils                   (cn)                                             │
│                                                                                  │
│ API routes use:                                                                  │
│   pages/api/meal-plan/index.ts ──► api-responses, api-logger, schemas,           │
│                                    openrouter.*, meal-plan.service, product.service │
│   pages/api/products/index.ts ───► api-responses, api-logger, schemas,           │
│                                    product.service                               │
│   pages/api/products/[id].ts ───► api-responses, api-logger, schemas,           │
│                                    product.service                               │
│   pages/api/shopping-list/index ► api-responses, api-logger, schemas,            │
│                                    shopping-list.service, product.service        │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ CROSS-CUTTING: PageHeader                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ inventory/PageHeader  (shared by Inventory, Meal Plan, Shopping List pages)      │
│   No child components; used by InventoryView, MealPlanView, ShoppingListView   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Summary

- **Pages**: Four Astro pages (`index`, `meal-plan`, `shopping-list`, `login`) each use `Layout.astro`, which mounts `AppNav` and `ToasterMount` plus one main view per page.
- **Containers**: `InventoryView`, `MealPlanView`, `ShoppingListView`, and `AuthFormContainer` own their feature trees; `MealPlanView` and `ShoppingListView` share `useMealPlanStorage` and `PageHeader`.
- **UI**: All interactive UI goes through `src/components/ui/*` (Shadcn), which depend only on `@/lib/utils` (e.g. `cn`).
- **Data/auth**: Features use `@/lib/auth-fetch`, `@/db/supabase.browser`, `@/lib/auth-*`, and `@/types`; API routes use `@/lib` (api-responses, api-logger, schemas, services).
