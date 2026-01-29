# UI Architecture for 10x Meal Planner (MVP)

## 1. UI Structure Overview

The 10x Meal Planner is a single-page web application with server-side rendering (Astro 5) and interactive React components. The UI is organized around three main authenticated areas—Inventory (home), Meal Plan, and Shopping List—plus a single unauthenticated Login/Register view. All app routes are protected; unauthenticated users are redirected to the login page.

The application uses a root layout with a persistent navigation bar. Meal plan and shopping list data are kept in client state and sessionStorage (key: `meal-planner-plan`); they are not persisted on the server. Products are fetched from the API on each view load and after mutations, with no client-side caching. The UI is designed for families managing kitchen inventory and weekly meal planning, with clear empty states, loading feedback, and consistent error handling aligned to the API (401 → login redirect; 4xx inline; 5xx/429 user-facing message and retry where applicable).

---

## 2. View List

### 2.1 Login / Register

- **View name:** Login / Register
- **View path:** `/login`
- **Main purpose:** Authenticate users (sign in or create account) and gate access to the rest of the application.
- **Key information to display:**
  - Sign-in form: email, password; “Sign in” / “Login” action.
  - Create-account form: email, password, password confirmation; “Create account” / “Register” action.
  - Toggle or tabs to switch between “Sign in” and “Create account” on the same page.
  - Validation and API error messages inline (e.g. invalid email, weak password, email already exists, “Invalid email or password”).
- **Key view components:**
  - Auth form container (single page, two modes).
  - Email and password inputs (password masked).
  - Password confirmation input (create-account only).
  - Submit buttons: “Sign in” and “Create account”.
  - Mode switcher (tabs or toggle).
  - Inline error/validation message area.
- **UX, accessibility, and security considerations:**
  - No “Forgot password” link for MVP.
  - After successful login or registration, redirect to `/` (inventory); optionally support `?redirect=` to send user to the originally requested app route if valid.
  - Labels for all inputs; focus management on mode switch.
  - Do not expose raw API or technical errors; show user-friendly messages only.
  - Protected routes redirect here with optional `?redirect=` when unauthenticated.

---

### 2.2 Inventory (Home)

- **View name:** Inventory (Kitchen)
- **View path:** `/`
- **Main purpose:** Let users view, search, add, edit, and delete kitchen products so inventory stays current for meal planning.
- **Key information to display:**
  - Product list: name, quantity, unit, expiration date, category (optional).
  - Expiration indicators: red/urgent (≤3 days), amber/warning (≤7 days), normal (beyond 7 days), distinct style for expired (e.g. gray or strikethrough); indicators must be discernible without color alone (e.g. icon or label).
  - Search field with debounced (e.g. 300 ms) filtering; clear “X” control; optional loading state near field.
  - Empty state: “No products in inventory. Add your first product to get started.” with “Add product” CTA.
  - No-search-results state: “No products match your search.” with “Clear search” / “Show all” CTA.
- **Key view components:**
  - Page header/title.
  - Search input (debounced, clear button).
  - “Add product” button.
  - Product list or table (one row per product: name, quantity, unit, expiration date, category, Edit, Delete).
  - Add/Edit product modal (or drawer on mobile) — same form component; Dialog/Sheet with focus trap and escape to close.
  - Product form: name (required), quantity (required, positive), unit (required, dropdown: kg, g, ml, L, pieces), expiration date (required), category (optional); inline validation errors.
  - Delete confirmation dialog: title “Delete product?”; body “Are you sure you want to delete [name]? This cannot be undone.”; Cancel (primary), Delete (destructive, not default).
  - Expiration indicator (visual + non-color cue) per row.
- **UX, accessibility, and security considerations:**
  - Products loaded via GET `/api/products` with default sort=expiration_date, order=asc, limit=200; no pagination UI for MVP.
  - After add: close modal, show success toast, move focus to “Add product” or first row; after edit: focus to that row’s Edit button; after delete: never leave focus on removed element.
  - Client-side validation mirrors API (required fields, quantity > 0, unit enum, date, max lengths); block submit until valid.
  - 401 from API → redirect to login; 400/422 → field-level or inline errors from API `details` when present.

---

### 2.3 Meal Plan

- **View name:** Meal Plan
- **View path:** `/meal-plan`
- **Main purpose:** Generate and view the weekly meal plan (7 days × breakfast/lunch/dinner) and allow regeneration; guide user to shopping list when relevant.
- **Key information to display:**
  - Primary action: “Generate Meal Plan” — disabled when inventory is empty, with tooltip “Add products to inventory first”.
  - Secondary action: “Regenerate All” / “Regenerate Meal Plan” when a plan exists; no confirmation; same loading behavior as first generation.
  - If no plan and empty inventory: message + CTA to go to `/` (inventory).
  - If no plan and inventory has items: empty state with “Generate Meal Plan” enabled.
  - If plan exists: 7-day table; columns = days; rows = breakfast, lunch, dinner. Each cell: dish name, ingredients with quantities (e.g. “Tomatoes - 500g”), preparation instructions (3–5 bullet points). Link or CTA to `/shopping-list`.
  - Loading: full-page or prominent loading state during generation (e.g. “Generating your meal plan…”); disable button.
  - Error (502/503/504): “Unable to generate meal plan. Please try again in a moment.” with Retry button; do not expose technical details.
  - 429: “Too many requests, please try again later” and disable retry briefly.
- **Key view components:**
  - Page header.
  - “Generate Meal Plan” button (with disabled state and tooltip when no products).
  - “Regenerate All” button (visible when plan exists).
  - Meal plan table (responsive: on narrow viewports use stacked/accordion or horizontal scroll; touch targets ≥ 44×44px, text ≥ 14px).
  - Meal cell content: dish name, ingredients list, instructions list.
  - Empty-state message and CTA to inventory.
  - Link/CTA to Shopping list.
  - Full-page or prominent loading indicator.
  - Error message and Retry button.
- **UX, accessibility, and security considerations:**
  - Start date: use API default only; no start-date picker for MVP.
  - Plan and shopping list from POST `/api/meal-plan` stored in memory and sessionStorage; hydrate from sessionStorage on load.
  - Long ingredient lists: cells expand or scroll as needed; text wrapping; no horizontal scrolling of entire page.
  - Table must be usable with keyboard and screen readers; structure (e.g. row/column headers) for accessibility.

---

### 2.4 Shopping List

- **View name:** Shopping List
- **View path:** `/shopping-list`
- **Main purpose:** Show missing ingredients for the current meal plan, grouped by category, so the user knows what to buy. Shopping list is rendered only on this route (not on the meal plan page).
- **Key information to display:**
  - Groups of items by category; categories in alphabetical order; uncategorized items under “Other” (last).
  - Each item: name and required quantity (e.g. “Tomatoes - 500g”).
  - Empty list: “Great! You have everything you need for this meal plan.”
  - If no meal plan in state: message directing user to generate a plan from `/meal-plan` or add products from `/`.
- **Key view components:**
  - Page header.
  - Grouped list (category heading + items per group).
  - Item row: name, quantity, unit.
  - Empty-state message when list is empty.
  - No-plan state: short message + link to meal plan or inventory.
- **UX, accessibility, and security considerations:**
  - Data comes from client state/sessionStorage; when inventory changes and a plan exists, client calls POST `/api/shopping-list` with current meal plan and updates state and sessionStorage, then re-renders.
  - List is read-only; no edit/delete of list items in MVP.
  - Accessible headings and list structure for screen readers.

---

## 3. User Journey Map

**First-time / unauthenticated:** User opens the app → middleware redirects to `/login` (optionally with `?redirect=`). User creates account or signs in → redirect to `/` (or to `redirect` if valid app route).

**Core flow (authenticated):**

1. **Inventory setup:** User lands on `/` (inventory). Sees empty state → clicks “Add product” → fills form (name, quantity, unit, expiration date, category) → saves → product appears in list. Repeats until inventory has enough items.
2. **Meal plan generation:** User goes to `/meal-plan` (nav). Clicks “Generate Meal Plan” → loading state → plan and shopping list appear. Plan is stored in memory and sessionStorage.
3. **View plan and shop:** User reads 7-day table (breakfast/lunch/dinner per day). Clicks link to `/shopping-list` → sees missing ingredients grouped by category. Uses list for shopping (offline).
4. **Regenerate (optional):** From `/meal-plan`, user clicks “Regenerate All” → new plan replaces previous one; shopping list updates; user can go to `/shopping-list` again.
5. **Inventory updates:** User returns to `/`, adds products from shopping trip or edits/deletes after cooking. If a plan exists, client calls POST `/api/shopping-list` and updates the displayed list (e.g. when user next visits `/shopping-list` or via global state if list is reflected elsewhere).
6. **Logout:** User clicks “Logout” in nav → session cleared → redirect to `/login`.

**Error flows:** 401 on any API call → redirect to `/login` with “Session expired or invalid. Please sign in again.” Invalid form data → inline validation; 400/422 from API → field-level or inline errors. Meal plan API failure (502/503/504) → message + Retry. 429 → message + temporary disable of retry.

---

## 4. Layout and Navigation Structure

- **Root layout:** One layout wraps all pages. Contains a single navigation bar visible on all authenticated pages. No hamburger or breakpoint-based nav hiding for MVP; nav is always fully visible.
- **Nav items:** Inventory (or Kitchen) → `/`; Meal plan → `/meal-plan`; Shopping list → `/shopping-list`; Logout (ends session, redirect to `/login`).
- **Login page:** No nav bar; only the login/register form. After auth, user sees the nav on all app pages.
- **Protected routes:** `/`, `/meal-plan`, `/shopping-list` are protected. Unauthenticated access redirects to `/login` with optional `?redirect=`.
- **Redirect after login/register:** Default `/`; if `?redirect=` is present and points to a valid app route (`/`, `/meal-plan`, `/shopping-list`), redirect there.

---

## 5. Key Components

- **App layout:** Root layout with nav bar; slot for page content; used by all authenticated pages.
- **Nav bar:** Links for Inventory, Meal plan, Shopping list, and Logout; active state for current route.
- **Product form:** Reusable for Add and Edit; fields: name, quantity, unit (dropdown: kg, g, ml, L, pieces), expiration date, category; validation and inline errors; submit and cancel.
- **Modal / Sheet:** Container for product form (modal on desktop, drawer/sheet on mobile); focus trap; escape to close; same form component for add and edit.
- **Delete confirmation dialog:** Title, body with product name, Cancel and Delete buttons; Delete destructive and not default.
- **Product list/table:** Rows with name, quantity, unit, expiration date, category, Edit, Delete; expiration indicator per row (discernible without color).
- **Search input:** Debounced input, clear “X”, optional loading indicator; no minimum character count for MVP.
- **Meal plan table:** 7-day × 3 meals structure; responsive (stacked/accordion or horizontal scroll on small screens); meal cell shows name, ingredients, instructions.
- **Shopping list grouped:** Category sections with “Other” last; item rows with name and quantity.
- **Toast (e.g. Sonner):** Single toast system for success messages (e.g. “Product added”, “Product updated”, “Product deleted”); short-lived.
- **Loading indicators:** Full-page or prominent for meal plan generation; local/spinner for product CRUD, search, and shopping-list refresh.
- **Empty states:** Dedicated blocks for no products, no search results, no meal plan (with/without inventory), empty shopping list; each with message and CTA where applicable.
- **Error message block:** For meal plan API errors (502/503/504, 429) and optional retry control; user-facing copy only.

These components are shared across views where applicable; validation, focus management, and error handling are applied consistently as described in the view list and session notes.
