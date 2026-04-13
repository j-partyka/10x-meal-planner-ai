# Authentication Architecture Specification — 10x Meal Planner

**Status:** Technical specification (design-only; not an implementation checklist)  
**Sources:** `.ai/prd.md`, `.ai/tech-stack.md`, `astro.config.mjs`, existing `src/` patterns  
**Goal:** Define registration, login, logout, and password recovery in a way that satisfies PRD user stories (US-000, US-001, US-025 and password recovery when product opts in) **without** breaking documented behavior: protected app routes, inventory/meal-plan/shopping flows, API contracts, RLS-backed data isolation, and performance expectations.

**Scope note:** This document does **not** govern AI model choice or meal-plan APIs beyond authentication. The PRD references both GPT-3.5-turbo (§4.1, technical infrastructure) and “GPT-4 via Openrouter” in US-008; implementation follows the tech stack / codebase, not the auth spec.

---

## 0. Compatibility and non-goals

### 0.1 PRD traceability (auth-related user stories)

| User story | PRD acceptance highlights | How this spec supports implementation |
|------------|---------------------------|----------------------------------------|
| **US-000** | Register on login screen; email + password + confirm; validate format; 8+ chars; match passwords; validate before submit; **auto-logged in** after success; errors for duplicate email / weak password; **redirect to inventory page** | Mode switcher or equivalent on `/login` exposes register (satisfies “Sign Up or Register” visibility). Validation and error copy in §1.4. Redirect to **`/`** (inventory) or allowlisted `redirect` — see **`/` = inventory** in §0.3. Session after `signUp` requires Supabase project settings (§1.5 item 8). |
| **US-001** | Email + masked password; Sign In; **Forgot Password optional**; invalid credentials copy; session across navigation + refresh; auth on APIs; unauthenticated → login | Forms and middleware in §1–§3. **Forgot password:** optional in PRD — §1.1 / §3.1 describe the flow when included; MVP can ship without it and still meet US-001 if “optional” is read as non-blocking. |
| **US-025** | Logout in nav/menu; ends session; redirect to login; no protected access after; **session cleared from browser storage**; must sign in again | `signOut` + redirect to `/login` (§1.5). Protected routes/APIs enforced by middleware. **Storage:** §3.2 — `signOut()` clears Supabase client session (cookies and any client persistence used by `@supabase/ssr` / browser client), satisfying PRD wording. |
| **§3.5 / Phase 0** | Password reset “if needed for MVP” | Same as US-001 optional link: spec documents **resetPasswordForEmail** + reset route for when the team includes recovery; not mandatory for every MVP cut if scope is tight. |

**PRD document quirk:** In §5.5, **US-024** (responsive layout) appears with only a title, while its description and acceptance criteria are merged under **US-025** in the source PRD. Implementation should treat responsive requirements as **US-024** and logout as **US-025**. Auth pages (`/login`, recovery routes) should meet the same responsive / touch-target expectations as the rest of the app (US-024).

### 0.2 PRD reconciliation (conflicts and redundancy)

| Topic | PRD says | Spec resolution |
|-------|----------|-----------------|
| **Forgot password / reset** | US-001: link “optional for MVP”; §3.5: “password reset (if needed for MVP)” | **Not contradictory:** treat recovery as **product-chosen** scope. Minimum stories: login + register + logout; add forgot/reset when stakeholders want Phase 0 password reset fully satisfied. This spec documents both paths so either release is implementable. |
| **Inventory redirect (US-000)** | “Redirected to inventory page” | **Inventory route in this app is `/`** (root). Equivalent to PRD “inventory page.” |
| **Email verification** | Out of scope / optional (§4.2) | **US-000** requires automatic login after registration. **Configuration contract:** Supabase should allow immediate session after sign-up (e.g. email confirmation disabled for MVP), **or** the UI must handle “confirm email” without claiming auto-login — second path conflicts with US-000; prefer config per PRD “optional verification.” |
| **“Register button” vs tabs** | US-000: visible “Sign Up” or “Register” button | A **mode switcher** (e.g. Sign in / Create account) or tab meets the intent: register affordance is visible on the login screen without a separate route. |
| **Shopping list API** | Tech stack lists custom endpoints | This codebase protects **`POST /api/shopping-list`** (and not a separate GET for the same resource). Auth applies to that POST as for other APIs. |

### 0.3 What must remain true

- **SSR mode:** `output: "server"` with `@astrojs/node` in `standalone` mode (`astro.config.mjs`) — pages are rendered on demand; auth must rely on **cookie-backed sessions** for HTML routes and **Bearer tokens** for protected JSON APIs, consistent with current middleware design.
- **Protected pages:** Authenticated users only on `/`, `/meal-plan`, `/shopping-list` (see `AUTH_REDIRECT_ROUTES` in `src/types.ts`); unauthenticated users redirect to `/login?redirect=…`. **`/` is the inventory page** (PRD US-000 redirect target).
- **Protected APIs:** `/api/products`, `/api/meal-plan`, `/api/shopping-list` require `Authorization: Bearer <access_token>`; middleware attaches `locals.userId` and an authenticated Supabase client.
- **Data isolation:** `products` and future tables remain tied to `auth.users` with RLS; no change to “user sees only own data” semantics.
- **Client data access:** Inventory and meal-plan UIs continue to use authenticated `fetch` (e.g. `authFetch` pattern) so behavior matches PRD “authentication applies to … API endpoints.”
- **PRD out-of-scope:** No social login, no 2FA, no roles, email verification optional — spec does not require these.

### 0.4 How this spec treats optional recovery

Sections **§1.1**, **§1.3**, and **§3.1** describe **forgot-password** and **reset-password** routes and components **for teams that include password reset** in a given release. That is **additive** to the minimum US-000 / US-001 / US-025 implementation. Shipping without those routes still aligns with PRD where “Forgot Password” and “password reset (if needed for MVP)” are optional; adding them aligns with Phase 0 / §3.5 when the product opts in.

---

## 1. User interface architecture

### 1.1 Route and page map

| Route | Mode | Purpose |
|-------|------|---------|
| `/login` | **Unauthenticated** (logged-in users redirected away) | Sign-in, registration (tab or mode switch), link to password recovery |
| `/forgot-password` *(recommended)* | **Unauthenticated** | Request password reset email |
| `/reset-password` or `/auth/reset` *(recommended)* | **Unauthenticated** (accessed from email link with tokens in URL/hash) | Set new password after clicking Supabase email link |
| `/` | **Authenticated** | Inventory (existing) |
| `/meal-plan` | **Authenticated** | Meal plan (existing) |
| `/shopping-list` | **Authenticated** | Shopping list (existing) |

**Contracts:**

- **Redirect allowlist:** After login/register, redirect only to paths in `AUTH_REDIRECT_ROUTES` (`/`, `/meal-plan`, `/shopping-list`) or extend the list in one place (`isAllowedRedirect`) if product adds routes — **never** open redirects to external URLs.
- **Login redirect:** Unauthenticated access to a protected page continues to use `/login?redirect=<pathname>` (encoded).

### 1.2 Layouts: authenticated vs. unauthenticated

**Current baseline:** Root `Layout.astro` wraps all pages and loads `AppNav` (inventory / meal plan / shopping list + logout) for every route, including `/login`.

**Target architecture (recommended for PRD alignment):**

| Layout module | Responsibility |
|---------------|----------------|
| **`Layout.astro` (root)** | HTML shell: `lang`, viewport, favicon, global CSS, title, optional theme |
| **`AppShellLayout.astro` (or props on `Layout`)** | **Authenticated** shell: main nav (`AppNav`), toasts, primary content slot |
| **`AuthLayout.astro`** | **Unauthenticated** shell: centered content, branding, **no** primary app nav (or minimal link “Back to sign in”), avoids implying logged-in state |

**Separation of concerns:**

- **Astro pages** own: which layout variant, `title`, passing **safe** server-derived props (e.g. validated `redirect` from query on `/login`), and `client:*` boundaries for React islands.
- **React** owns: form state, submission, loading/disabled states, inline validation messaging, calling Supabase Auth via `supabaseBrowser`, and full-page navigation (`window.location`) after success where cookies must be committed.

**Compatibility note:** Migrating login to `AuthLayout` is a **presentation** change; middleware and APIs stay the same. Existing behavior (protected routes, APIs) is preserved.

### 1.3 Components: matrix and responsibilities

| Area | Component / module | Owner | Responsibility |
|------|----------------------|-------|------------------|
| Auth shell | `AuthFormContainer` | React | Mode switching (sign-in vs register), shared email/password state, submit orchestration, maps errors via `auth-errors`, validation via `auth-validation` |
| Sign-in | `SignInForm` | React | Presentational form: email, password, submit |
| Register | `CreateAccountForm` | React | Presentational form: email, password, confirm password, submit |
| Mode toggle | `ModeSwitcher` | React | Accessible switch between sign-in and register |
| Errors | `InlineErrorArea` | React | Single summary error region (`aria-describedby` on forms) |
| **Recovery (new)** | `ForgotPasswordForm` | React | Email field; calls `resetPasswordForEmail`; success/info state |
| **Recovery (new)** | `ResetPasswordForm` | React | New password + confirm; calls `updateUser` or exchange code session per Supabase flow |
| App chrome | `AppNav` | React | Nav links; **Logout** calls `supabaseBrowser.auth.signOut()` then navigates to `/login` |
| Toasts | `ToasterMount` | React | Global feedback (optional for auth; PRD emphasizes inline errors for auth) |

**Astro vs React split:**

- **Astro** renders static structure and chooses layout; **does not** embed secrets.
- **React** performs all **interactive** auth operations (Supabase client runs in the browser with anon key; session persisted via `@supabase/ssr` cookie behavior).

### 1.4 Validation cases and user-facing messages

**Client-side (before Supabase call)** — align with `src/lib/auth-validation.ts` conventions:

| Field / rule | Sign-in | Register |
|--------------|---------|----------|
| Email empty | “Email is required.” | Same |
| Email format | “Please enter a valid email address.” | Same |
| Password empty | “Password is required.” | “Password is required.” |
| Password length | *(no min on sign-in; server rejects bad combo)* | “Password should be at least 8 characters.” |
| Confirm password | N/A | “Passwords do not match.” |

**PRD-specific:**

- **US-001:** Incorrect credentials → single message: **“Invalid email or password.”** (see `mapSignInError` — do not leak whether email exists).
- **US-000:** Weak password / server rejection → friendly message; duplicate email → **“An account with this email already exists.”** (pattern in `mapSignUpError`).

**Password recovery (recommended messages):**

| Case | Message |
|------|---------|
| Forgot: invalid email format | Same as other forms (valid email) |
| Forgot: submit success | Neutral confirmation: e.g. “If an account exists, we sent a link to reset your password.” (avoid account enumeration) |
| Reset: weak password | Match register rules (min 8 characters) |
| Reset: success | Redirect to `/login` with optional query `?reset=success` |
| Token expired / invalid | “This reset link is invalid or expired. Request a new one.” |

**Implementation contract:** Keep mapping functions in a dedicated module (extend `auth-errors.ts` or add `auth-recovery-errors.ts`) so copy stays consistent and testable.

### 1.5 Key scenarios (end-to-end behavior)

1. **Register (US-000)**  
   User completes register form → client validation → `signUp` → on success, session established per Supabase project settings → redirect to `redirect` or `/` → middleware sees cookie session on next request → inventory loads; RLS scopes data.

2. **Sign-in (US-001)**  
   User submits credentials → `signInWithPassword` → on failure, single invalid-credentials message → on success, redirect to allowlisted path → refresh/navigation keeps session via cookies.

3. **Protected route**  
   Anonymous user opens `/meal-plan` → middleware redirects to `/login?redirect=%2Fmeal-plan` → after login, user lands on meal plan.

4. **Logout (US-025)**  
   User clicks Logout → `signOut` clears session → hard navigation to `/login` → middleware denies protected routes until login again.

5. **API call while logged in**  
   Client obtains session → `authFetch` adds `Authorization: Bearer` → API middleware validates JWT → handler uses `locals.userId` / scoped Supabase client.

6. **API call without / expired token**  
   Returns `401` with JSON `{ error: "Unauthorized" }` → client may redirect to login with `redirect` query (existing `authFetch` behavior).

7. **Password recovery**  
   User requests reset → Supabase sends email → user opens link → app route loads → user sets new password → session behavior per Supabase (PKCE/session) → redirect to login.

8. **Email confirmation vs. US-000 “automatically logged in”**  
   PRD §4.2 marks email verification as optional/out of scope. **US-000** requires the user to be automatically logged in after successful registration. **Preferred MVP setup:** Supabase project allows an immediate session after `signUp` (e.g. email confirmation disabled), matching both. If confirmation were enabled, the app would show a “check your email” state and **would not** meet US-000 until the user confirms — avoid that for MVP unless PRD is revised.

---

## 2. Backend logic

### 2.1 API surface (auth-related)

**No separate first-party REST auth API is required** for core flows: Supabase Auth HTTP API handles credentials. The app already exposes **resource APIs** protected by JWT:

| Prefix / route | Auth mechanism | Purpose |
|----------------|----------------|---------|
| `GET/PATCH/POST/DELETE` `/api/products` | Bearer JWT | Product CRUD |
| `GET` / `POST` `/api/meal-plan` | Bearer JWT | GET: prompt preview; POST: generate plan (both protected) |
| `POST` `/api/shopping-list` | Bearer JWT | Shopping list (compute from meal plan + inventory) |

**Optional server endpoints (only if product needs them):**

| Route | Purpose |
|-------|---------|
| `GET /api/auth/session` | Debug or SSR hydration (usually unnecessary if middleware + client session suffice) |

**Contract:** Protected APIs **do not** accept session cookies alone for authorization; they require `Authorization: Bearer` as today, so programmatic clients and `authFetch` stay consistent.

### 2.2 Data models

| Entity | Storage | Notes |
|--------|---------|-------|
| User | Supabase `auth.users` | IDs used as `user_id` in `public.products` |
| Session | Supabase session (JWT access token, refresh) | Persisted via `@supabase/ssr` cookie adapter on server; browser client keeps parity |
| Products | `public.products` | Unchanged; RLS uses `auth.uid()` |

No new tables are **required** for password reset; optional `profiles` table is out of MVP scope per PRD.

### 2.3 Input validation mechanism

| Layer | Mechanism | Applies to |
|-------|-----------|------------|
| Client auth forms | Pure functions + regex (`auth-validation` style) | Email, password length, confirm match |
| Resource APIs | Zod schemas (`src/lib/schemas/*`) | Product commands, meal-plan commands — **unchanged** |
| Supabase Auth | Server-side rules in Supabase project | Password strength, email format on auth endpoints |

**Contract:** Any **new** server route that accepts body data must use Zod `.safeParse()` early and return `400` with structured error payload consistent with existing API helpers (`lib/api-responses.ts` patterns).

### 2.4 Exception handling

| Area | Pattern |
|------|---------|
| Auth forms | Catch network/unknown errors → generic “Something went wrong. Please try again.”; log details only in `DEV` |
| `mapSignInError` / `mapSignUpError` | Never expose raw Supabase messages to users |
| API routes | Centralized JSON errors; 401 for missing/invalid JWT; 403 if ever needed for policy; 5xx with safe message for AI/external failures (already separate for OpenRouter) |
| Middleware | Redirect for HTML; JSON `401` for protected API paths without Bearer token |

### 2.5 Server-side rendering and `astro.config.mjs`

Facts from config:

- `output: "server"` — routes are server-rendered unless opted out.
- `@astrojs/node` `standalone` — Node server; middleware runs on each request.

**Rendering strategy for auth:**

- **Do not** prerender `/login`, recovery routes, or protected pages as static HTML — they depend on session and redirects.
- **Middleware** (`src/middleware/index.ts`) remains the single gate for: (1) protected HTML routes, (2) session refresh cookies for `/login`, (3) Bearer validation for API prefixes.
- **Astro pages** may pass only **non-sensitive** props to React (e.g. allowed `redirect` path). User email or tokens must not be embedded in HTML props.

**Sitemap:** `@astrojs/sitemap` integration is present; **auth URLs should be excluded** from the public sitemap (configure `filter` or `customPages` in sitemap integration when implementing) so login/reset URLs are not advertised as landing pages.

---

## 3. Authentication system (Supabase + Astro)

### 3.1 Supabase Auth capabilities used

| Capability | Client API (browser) | PRD / story |
|------------|----------------------|-------------|
| Register | `auth.signUp({ email, password })` | US-000 |
| Login | `auth.signInWithPassword({ email, password })` | US-001 |
| Logout | `auth.signOut()` | US-025 |
| Session read | `auth.getSession()` | Bearer for APIs, redirect logic |
| Password reset request | `auth.resetPasswordForEmail(email, { redirectTo })` | Recovery |
| Password update | `auth.updateUser({ password })` after recovery session | Recovery |

**Email link handling:** Supabase redirects to `redirectTo` with tokens in URL; the app must include a **dedicated route** that initializes the client, exchanges/recovers session per Supabase v2 docs, then shows `ResetPasswordForm`.

### 3.2 Session and cookie architecture

| Component | Role |
|-----------|------|
| `src/db/supabase.browser.ts` | `createBrowserClient` — persists session so middleware can read cookies |
| `src/db/supabase.server.ts` | `createServerClient` + cookie adapter — used in middleware for `getSession()` |
| Middleware | Syncs cookies on auth responses; redirects based on session presence |

**Contract:** Server `Layout` and pages **must not** duplicate auth state; rely on middleware + client hydration for nav visibility.

**US-025 / PRD wording:** `signOut()` clears the Supabase session for the client, including auth cookies used by SSR and any storage the client uses; treat this as satisfying “session data is cleared from browser storage” in US-025.

### 3.3 Environment variables (contract)

| Variable | Usage |
|----------|--------|
| `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client |
| `SUPABASE_URL` / `SUPABASE_KEY` | Server/middleware (anon key via `@supabase/ssr`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Not** used for end-user auth flows; only if secure admin automation is added |
| Site URL | For `redirectTo` in password reset — must match deployed origin (e.g. `PUBLIC_SITE_URL` or platform env) |

### 3.4 Supabase dashboard configuration (operational contract)

- **Auth → URL configuration:** Site URL and redirect allowlist must include production and preview origins for magic links / recovery.
- **Email templates:** Customize reset email if branding required; link must hit the app’s reset route.
- **Password policy:** Minimum length ≥ 8 to match client copy (PRD).

### 3.5 Middleware contract (reference)

Existing behavior to preserve:

- **Protected API:** No Bearer → `401` JSON.
- **Protected page:** No session → redirect to `/login?redirect=…`.
- **Login page:** Session present → redirect to `redirect` if allowlisted, else `/`.
- **`isAllowedRedirect`:** Central guard against open redirects.

Extensions for recovery routes:

- Treat `/forgot-password` and `/reset-password` (or chosen paths) as **public** HTML routes (no session required), same as `/login` for middleware `needsSessionCheck` logic — **do not** redirect them to login.

### 3.6 Security considerations

- **Open redirect:** Only allowlisted paths after login/register/reset.
- **CSRF:** Cookie-based session for HTML; mutations to APIs use Bearer from same-origin JS — keep APIs same-origin.
- **Token leakage:** Do not log access tokens; PRD requires technical details hidden from users on failures.
- **Rate limiting:** Supabase limits apply; optional future: rate-limit forgot-password submissions by IP (not MVP).

### 3.7 Testing contracts (from tech stack)

- **Vitest:** Unit-test `auth-validation`, redirect helpers, error mappers, and any new recovery mappers.
- **Playwright:** E2E for login, register, logout, protected redirect, password recovery happy path — aligns with `.ai/test-plan.md` scope.

---

## 4. Module and file map (indicative)

| Concern | Location (existing or to add) |
|---------|-------------------------------|
| Middleware gate | `src/middleware/index.ts` |
| Redirect allowlist | `src/types.ts` (`AUTH_REDIRECT_ROUTES`, `isAllowedRedirect`) |
| Browser auth client | `src/db/supabase.browser.ts` |
| Server session client | `src/db/supabase.server.ts` |
| Auth forms orchestration | `src/components/auth/AuthFormContainer.tsx` |
| Sign-in / register UI | `src/components/auth/SignInForm.tsx`, `CreateAccountForm.tsx` |
| Auth copy / errors | `src/lib/auth-errors.ts`, `src/lib/auth-validation.ts` |
| Authenticated fetch | `src/lib/auth-fetch.ts` |
| Login page | `src/pages/login.astro` |
| Recovery pages | `src/pages/forgot-password.astro`, `src/pages/reset-password.astro` *(recommended)* |
| App nav / logout | `src/components/AppNav.tsx` |
| Layouts | `src/layouts/Layout.astro`, optional `AuthLayout.astro` / shell split |

---

## 5. Summary

This specification aligns **Supabase Auth** (email/password, session cookies via `@supabase/ssr`, JWT for APIs) with **Astro 5 SSR** (`output: "server"`, Node adapter) and the PRD user stories **US-000**, **US-001**, and **US-025**, with **password recovery** documented for optional / Phase 0 scope (see §0.2, §0.4). It preserves existing **middleware**, **Bearer API** semantics, **RLS** data isolation, and **redirect allowlisting** (inventory = `/`). It recommends an **auth-specific layout** and **recovery forms** where those features are included; minimal MVP can defer recovery UI per PRD. **US-024** responsive and touch-target expectations apply to auth pages as to the rest of the app.
