# UI Architecture Decisions (MVP)

Decisions made for the MVP UI architecture, based on the PRD, tech stack, and API plan. Use this document when creating detailed UI architecture, user journey maps, and navigation structure.

---

## 1. Routes and view structure

**Decision:** Use separate routes.

- **Inventory:** Primary route (e.g. `/` or `/inventory`) — product list, add/edit/delete, search.
- **Meal plan:** Dedicated route (e.g. `/meal-plan`) — 7-day plan, “Regenerate” action.
- **Shopping list:** Dedicated route only at `/shopping-list` — missing ingredients grouped by category (not rendered as a section on the meal plan page).

Navigation between these routes is explicit (e.g. nav links or tabs).

---

## 2. Meal plan and shopping list state

**Decision:** Keep the last generated meal plan (and shopping list) in client-side state and persist to `sessionStorage`.

- In-memory state (e.g. React context or global state) so the plan survives navigation.
- Persist the same data to `sessionStorage` so it survives page refresh within the same tab.
- Do not persist to backend (API does not support it).
- Clear or overwrite when user generates a new plan.

---

## 3. Shopping list refresh after inventory changes

**Decision:** When the user changes inventory (add/edit/delete) and a meal plan already exists in state, call `POST /api/shopping-list` with the current meal plan and update the displayed shopping list.

- Keeps the list accurate without regenerating the full plan.
- No automatic refresh when no plan exists.

---

## 4. Products list pagination

**Decision:** For MVP, load a single page with `limit=200`.

- No “Load more” or infinite scroll for MVP.
- No explicit pagination controls (prev/next) for MVP.
- If the list grows beyond 200 items, document as a known limitation or revisit in a future iteration.

---

## 5. API error handling

**Decision:** As recommended in the UI architecture Q&A.

- **401:** Redirect to login with a single “Session expired or invalid. Please sign in again.” message; clear session state.
- **400 / 422:** Show field-level or inline messages using API `details` when present.
- **404:** “Not found” with way to return to list.
- **429:** “Too many requests, please try again later” and disable retry briefly.
- **502 / 503 / 504 (meal plan):** “Unable to generate meal plan. Please try again in a moment.” with Retry button.
- Log technical details only; never expose raw API errors to users.

---

## 6. Authentication and session handling

**Decision:** Centralize auth and “session expired” handling.

- Astro middleware for route protection.
- Shared API client (or fetch wrapper) that attaches the Supabase session (cookie or `Authorization` header).
- On any 401 from API: clear session and redirect to login with the same message (see §5).
- All API-driven views behave consistently.

---

## 7. Meal plan table responsiveness

**Decision:** Responsive meal plan table as recommended.

- On narrow viewports (e.g. mobile): stacked or accordion layout (e.g. one day per card, expandable breakfast/lunch/dinner), or horizontal scroll with sticky day column.
- Avoid a single wide table that forces full-page horizontal scroll.
- Minimum touch targets 44×44px; text at least 14px (per PRD).

---

## 8. Product form validation

**Decision:** Client-side validation mirrors the API.

- Same rules: required fields, quantity > 0, unit enum (`kg`, `g`, `ml`, `L`, `pieces`), valid date, max lengths (name, category).
- Inline errors next to fields; block submit until valid.
- Reduces unnecessary 400s and improves UX.

---

## 9. Loading states

**Decision:** As recommended.

- **Long-running (e.g. `POST /api/meal-plan`):** Full-page or prominent inline loading (“Generating your meal plan…”); disable trigger button to prevent double submission.
- **Short calls (product CRUD, search, `POST /api/shopping-list`):** Local loading (e.g. button spinner or row-level feedback).
- Optional: lightweight global “request in progress” to disable critical actions or show a thin global indicator.

---

## 10. Caching

**Decision:** Do not use cache for MVP.

- Products list: refetch when the view is loaded or when returning to the inventory view (no client-side cache).
- Meal plan and shopping list: only in-memory + `sessionStorage` as in §2; no separate caching layer.
- After any product create/update/delete, refetch or update list as needed without relying on cache.

---

## 11. Route paths

**Decision:** Inventory at `/` (home); meal plan at `/meal-plan`; shopping list at `/shopping-list`.

- App opens on inventory. Nav “home” or “Inventory” / “Kitchen” links to `/`.

---

## 12. Main navigation

**Decision:** Single nav bar in root layout (e.g. Layout.astro) with links: Inventory (or “Kitchen”), Meal plan, Shopping list, Logout.

- Do not implement hamburger or collapsed menu for MVP; no breakpoints for nav. Nav bar is always visible in full.
- Nav visible on all authenticated pages so users can switch views without relying on browser back.

---

## 13. Success feedback

**Decision:** Short-lived toasts for success (e.g. “Product added”, “Meal plan generated”).

- Inline/field-level feedback remains for validation and API error messages.
- Use one toast component (e.g. Shadcn Sonner or similar) for consistency.

---

## 14. Expiration indicators in inventory list

**Decision:** Clear visual cues: left border or background tint (red for ≤3 days, amber for ≤7 days, gray for expired), plus optional small badge or icon.

- Expiration date shown in readable format (e.g. “Jan 25, 2026”).
- Ensure contrast and that state is discernible without color alone (e.g. icon or label).

---

## 15. Product unit field

**Decision:** Dropdown with the five allowed values: `kg`, `g`, `ml`, `L`, `pieces`.

- Matches API enum; avoids validation errors. In list view, show unit as read-only text (e.g. “500 g”).

---

## 16. Post-login / post-registration redirect

**Decision:** Redirect to `/` (inventory) after both login and registration.

- Single predictable entry point. Optional later: store originally requested URL and redirect there after login.

---

## 17. sessionStorage key and structure for meal plan

**Decision:** Single key (e.g. `meal-planner-plan`) with one JSON object: `{ mealPlan, shoppingList, generatedAt }`.

- Read on app load and hydrate in-memory state; write after each successful `POST /api/meal-plan` and when updating the shopping list (e.g. after `POST /api/shopping-list`).

---

## 18. Meal plan start date

**Decision:** Use API default only (today or next day); do not add a start-date picker for MVP.

- Do not send `startDate` unless you add a picker later; let the server decide.

---

## 19. Login and Register screens

**Decision:** One page (e.g. `/login`) with toggle or tabs: “Sign in” and “Create account”.

- Same layout and route; only the form and copy change. Matches PRD: “Sign Up or Register button is visible on login screen”.

---

## 20. Shopping list “Other” category label

**Decision:** Use the label **“Other”** for items without a category (null or empty).

- Category groups in consistent order (e.g. alphabetical by category name, with “Other” last).

---

## 21. Add / Edit product form presentation

**Decision:** Modal (or drawer on mobile) for both add and edit; reuse the same form component.

- Keeps user on inventory list. Use Shadcn Dialog or Sheet; trap focus and allow escape to close.

---

## 22. Delete product confirmation

**Decision:** Title: “Delete product?” Body: “Are you sure you want to delete [product name]? This cannot be undone.” Primary action: “Cancel”. Destructive action: “Delete” (e.g. `variant="destructive"`). “Delete” is not the default (reduces accidental deletes).

---

## 23. Product search debounce and behavior

**Decision:** Debounce search input (e.g. 300 ms) before calling `GET /api/products?search=...`. Clear “X” to reset. No minimum character count for MVP. Show loading state (e.g. spinner near field) while request is in flight.

---

## 24. Empty inventory and meal plan page

**Decision:** Disable “Generate Meal Plan” when user has no products; tooltip: “Add products to inventory first”. On meal plan page: if no plan and empty inventory, show same message + CTA to `/`. If plan exists but inventory is now empty, still show existing plan and shopping list.

---

## 25. Regenerate meal plan

**Decision:** No confirmation; run immediately. Same full-page or prominent loading state as first generation.

---

## 26. Empty-state copy and CTAs

**Decision:** No products: “No products in inventory. Add your first product to get started.” + prominent “Add product” button. No search results: “No products match your search.” + “Clear search” or “Show all”. Match PRD wording for main empty state.

---

## 27. Focus after product add / edit

**Decision:** After successful add: close modal, show toast, move focus to “Add product” button or first row. After edit: close modal, return focus to that row’s edit button or “Add product” button. Do not leave focus on removed element.

---

## 28. Products list default sort

**Decision:** Use API default: `sort=expiration_date`, `order=asc` (soonest expiring first). Do not expose sort/filter controls in UI for MVP.

---

## 29. Forgot password link

**Decision:** Do not implement forgot password flow for MVP. Omit the “Forgot password” link on the login page.

---

## 30. Protected route redirect and return URL

**Decision:** Redirect unauthenticated users to `/login`. Optionally append `?redirect=/meal-plan` (or requested path); after successful login redirect to that path if it’s a known app route, otherwise to `/`. Middleware or login form reads param and performs redirect after auth.
