# Conversation Summary: UI Architecture Planning for MVP

<conversation_summary>

## <decisions>

1. Use separate routes for Inventory, Meal plan, and Shopping list. Shopping list is rendered only at `/shopping-list` (not as a section on meal plan page).
2. Keep last generated meal plan and shopping list in client-side state and persist to sessionStorage.
3. When inventory changes and a plan exists, call POST /api/shopping-list and update the displayed list.
4. Products list: single page with limit=200; no pagination for MVP.
5. API error handling: 401 → redirect to login; 400/422 → field-level/inline; 404 → not found + back; 429 → user message + disable retry briefly; 502/503/504 (meal plan) → user message + Retry; log technical details only.
6. Centralize auth and session handling (middleware, shared API client, 401 → redirect).
7. Meal plan table responsive: stacked/accordion or horizontal scroll on narrow viewports; 44×44px touch targets, 14px text.
8. Client-side product validation mirrors API (required fields, quantity > 0, unit enum, date, max lengths); inline errors.
9. Loading: full-page/prominent for meal plan generation; local for CRUD/search/shopping-list refresh.
10. No cache for MVP; refetch products when needed; meal plan only in memory + sessionStorage.
11. Routes: `/` = inventory (home), `/meal-plan`, `/shopping-list`.
12. Single nav bar in root layout: Inventory (or Kitchen), Meal plan, Shopping list, Logout; do not implement hamburger or breakpoints for nav (nav always visible in full).
13. Success feedback via short-lived toasts; one toast component (e.g. Shadcn Sonner).
14. Expiration indicators: red (≤3 days), amber (≤7 days), gray (expired); left border or background + optional badge; date readable; not color-only.
15. Product unit: dropdown with kg, g, ml, L, pieces.
16. Post-login and post-registration redirect to `/` (inventory).
17. sessionStorage key `meal-planner-plan`, object `{ mealPlan, shoppingList, generatedAt }`.
18. Meal plan start date: use API default only; no start-date picker for MVP.
19. Login and Register: one page `/login` with “Sign in” / “Create account” toggle or tabs.
20. Shopping list uncategorized items: label “Other”; category groups alphabetical, “Other” last.
21. Add/Edit product: modal (or drawer on mobile); same form component; Shadcn Dialog/Sheet; trap focus.
22. Delete confirmation: “Delete product?” / “Are you sure you want to delete [name]? This cannot be undone.”; Cancel primary, Delete destructive; Delete not default.
23. Search: debounce 300 ms; clear “X”; no min chars; loading state near field.
24. Empty inventory: disable “Generate Meal Plan” + tooltip “Add products to inventory first”; meal plan page: no plan + empty → message + CTA to `/`; plan exists + empty inventory → show existing plan.
25. Regenerate meal plan: no confirmation; run immediately; same loading state as first generation.
26. Empty states: no products → “No products in inventory. Add your first product to get started.” + “Add product”; no search results → “No products match your search.” + “Clear search” / “Show all”.
27. Focus after add/edit: close modal, toast; focus to “Add product” or first row (add) or edit button of row (edit); never leave focus on removed element.
28. Products list default sort: sort=expiration_date, order=asc; no sort/filter UI for MVP.
29. Do not implement forgot password flow for MVP; omit “Forgot password” link on login page.
30. Protected route: redirect to `/login`; optionally `?redirect=`; after login redirect to that path if known app route, else `/`.

</decisions>

## <matched_recommendations>

1. Use separate routes: `/` (inventory), `/meal-plan`, `/shopping-list` with explicit nav links.
2. Keep meal plan and shopping list in client state + sessionStorage; hydrate on load; write after generation and after shopping-list refresh.
3. Call POST /api/shopping-list when inventory changes and a plan exists; update displayed list.
4. Products list: single page, limit=200; no pagination controls for MVP.
5. Centralized error handling: 401 → login redirect with single message; 4xx inline/field; 5xx/429 user-facing message and retry where applicable.
6. Centralized auth: Astro middleware + shared API client attaching Supabase session; 401 → clear session and redirect.
7. Responsive meal plan: stacked/accordion or horizontal scroll on small screens; 44×44px targets, 14px text.
8. Client-side product validation mirroring API; inline errors; block submit until valid.
9. Long-running meal plan: full-page or prominent loading + disable button; short calls: local loading (spinner/row).
10. No cache; refetch products on view load; meal plan only in memory + sessionStorage.
11. Inventory at `/`; nav “Inventory”/“Kitchen” links to `/`.
12. Single nav in Layout.astro; no hamburger or breakpoints for MVP; nav on all authenticated pages.
13. Toasts for success; one component (e.g. Shadcn Sonner); inline/field for validation and API errors.
14. Expiration: red/amber/gray cues + optional badge; readable date; discernible without color (icon/label).
15. Unit dropdown: kg, g, ml, L, pieces; list shows read-only unit text.
16. Redirect to `/` after login and registration; optional later: redirect to originally requested URL.
17. sessionStorage key `meal-planner-plan`, structure `{ mealPlan, shoppingList, generatedAt }`.
18. Meal plan start date: API default only; do not send startDate for MVP.
19. One `/login` page with “Sign in” / “Create account” toggle or tabs.
20. Shopping list: label “Other” for uncategorized; groups alphabetical, “Other” last.
21. Add/Edit product in modal (drawer on mobile); same form; Shadcn Dialog/Sheet; focus trap and escape to close.
22. Delete confirmation copy and button roles as in decision 22; destructive “Delete” not default.
23. Search debounce 300 ms; clear “X”; loading state; no min chars for MVP.
24. Disable “Generate Meal Plan” when empty inventory + tooltip; meal plan page empty states as in decision 24.
25. Regenerate: no confirmation; immediate; same loading as first generation.
26. Empty-state copy and CTAs as in decision 26; match PRD for main empty state.
27. Focus management after add/edit: close modal, toast, move focus to stable target; never on removed element.
28. Default sort expiration_date asc; no sort/filter UI for MVP.
29. Do not implement forgot password flow; omit “Forgot password” link for MVP.
30. Redirect to `/login` with optional `?redirect=`; after login redirect to that path if valid app route.

</matched_recommendations>

## <ui_architecture_planning_summary>

### Main UI architecture requirements

- **Routes:** Three main app routes: `/` (inventory/home), `/meal-plan`, `/shopping-list`. Shopping list is rendered only at `/shopping-list`. Auth at `/login` (sign in + create account on one page).
- **Layout:** Root layout contains a single nav bar (Inventory, Meal plan, Shopping list, Logout) visible on all authenticated pages; do not implement hamburger or breakpoints for nav (nav always visible in full).
- **State:** Meal plan and shopping list live in client state (e.g. React context) and in sessionStorage under key `meal-planner-plan` as `{ mealPlan, shoppingList, generatedAt }`. No backend persistence for plans. Products list is not cached; refetched on view load and after mutations.
- **Forms and feedback:** Add/Edit product in a modal (or drawer on mobile), same form component. Success via toasts; validation and API errors inline/field-level. Delete uses a confirmation dialog with explicit copy and destructive “Delete” not as default.
- **Validation:** Client-side product validation matches API (required fields, quantity > 0, unit enum, date, max lengths). Unit field is a dropdown (kg, g, ml, L, pieces).
- **Empty and loading states:** Defined empty-state copy and CTAs for no products and no search results. “Generate Meal Plan” disabled when inventory empty with tooltip. Full-page or prominent loading for meal plan generation; local loading for CRUD, search, and shopping-list refresh.

### Key views, screens, and user flows

- **Login/Register:** Single `/login` page with “Sign in” / “Create account” toggle or tabs. After success, redirect to `/` (or to `?redirect=` path if provided and valid). Do not implement forgot password flow for MVP; omit “Forgot password” link.
- **Inventory (`/`):** List of products (default sort: expiration_date asc, limit 200). Search with debounce (300 ms) and clear “X”. Add product opens modal; Edit/Delete per row with delete confirmation. Expiration indicators (red/amber/gray + optional badge). Empty state: message + “Add product” CTA. When inventory changes and a plan exists, call POST /api/shopping-list and update stored/displayed list.
- **Meal plan (`/meal-plan`):** “Generate Meal Plan” (disabled if no products, tooltip); “Regenerate” runs immediately with no confirmation. 7-day table; on narrow viewports use stacked/accordion or horizontal scroll. If no plan and empty inventory: message + CTA to `/`. If plan exists: show plan and link to `/shopping-list` for the list. Start date: API default only (no picker in MVP).
- **Shopping list (`/shopping-list`):** Shopping list is rendered only at this route. Display list grouped by category; uncategorized under “Other” (last). Same data as in state/sessionStorage; updated when POST /api/shopping-list is called after inventory changes.
- **Protected access:** Unauthenticated access to app routes redirects to `/login` with optional `?redirect=` for post-login redirect.

### API integration and state management strategy

- **Products:** GET /api/products with optional search, default sort=expiration_date&order=asc, limit=200. POST/PATCH/DELETE via /api/products and /api/products/:id. No client cache; refetch on load and after create/update/delete.
- **Meal plan:** POST /api/meal-plan (no startDate in MVP). Response (mealPlan + shoppingList) stored in memory and sessionStorage; hydrate from sessionStorage on load.
- **Shopping list:** POST /api/shopping-list when inventory changes and a plan exists; request body includes current meal plan; response updates state and sessionStorage.
- **Auth:** Supabase session sent with all API calls (shared client or fetch wrapper). 401 from any endpoint: clear session, redirect to login with single message.

### Responsiveness, accessibility, and security considerations

- **Responsiveness:** Breakpoints implied for desktop, laptop, tablet, mobile (PRD). Meal plan table adapts (stacked/accordion or horizontal scroll). Do not implement hamburger or breakpoints for nav. Touch targets ≥ 44×44px; text ≥ 14px.
- **Accessibility:** Expiration state discernible without color (icon/label). Focus management after modal close (focus to “Add product” or row edit button). Modal/drawer with focus trap and escape to close. Use Shadcn/ui (Radix-based) for components. Form labels and inline errors for validation and API errors.
- **Security:** Auth required for all app API usage. Middleware protects app routes; unauthenticated users redirected to `/login`. API keys (e.g. OpenRouter) server-side only. No sensitive or raw API errors shown in UI.

### Unresolved issues and areas for clarification

- **None** from the conversation; all 30 questions were answered. Clarifications recorded: shopping list is rendered only at `/shopping-list`; do not implement hamburger or breakpoints for nav; do not implement forgot password flow for MVP.

</ui_architecture_planning_summary>

## <unresolved_issues>

- None. All discussed items received a decision. Clarifications: shopping list only at `/shopping-list`; no nav hamburger or breakpoints for MVP; no forgot password flow for MVP.

</unresolved_issues>

</conversation_summary>
