# View Implementation Plan: Login / Register

## 1. Overview

The Login / Register view is the unauthenticated entry point of the application. It allows users to sign in with email and password or create a new account. Both modes (Sign in and Create account) are presented on a single page with a mode switcher (tabs or toggle). After successful authentication, the user is redirected to the inventory page (`/`) or to the originally requested route when `?redirect=` is present and valid. This view gates access to all protected routes; unauthenticated users are redirected here by middleware.

## 2. View Routing

- **Path:** `/login`
- **Astro page:** `src/pages/login.astro`
- **Protected:** No. This route is public; authenticated users may be redirected away to `/` (or `redirect`) if desired.
- **Redirect after auth:** Default `/`; if query param `redirect` is present and equals a valid app route (`/`, `/meal-plan`, `/shopping-list`), redirect there.

## 3. Component Structure

```
LoginPage (Astro page)
└── AuthFormContainer (React, client:load)
    ├── ModeSwitcher (tabs or toggle: "Sign in" | "Create account")
    ├── SignInForm (email, password, "Sign in" button)
    ├── CreateAccountForm (email, password, password confirmation, "Create account" button)
    └── InlineErrorArea (validation and API error messages)
```

The Auth form container can render either the Sign-in form or the Create-account form based on mode; both forms share the same page and an inline error/validation message area.

## 4. Component Details

### AuthFormContainer

- **Description:** Single-page auth container that switches between "Sign in" and "Create account" modes. Renders the active form, mode switcher, and a shared inline error/validation message area. Handles submit for both modes and redirect on success.
- **Main elements:** Root container (e.g. `main` or `div`), ModeSwitcher (Tabs or Toggle from Shadcn/ui), conditional form (SignInForm or CreateAccountForm), inline error/validation block (e.g. `Alert` or `p` with `role="alert"`).
- **Handled events:** Mode change (tab/toggle click), Sign in submit, Create account submit. On submit: validate, call Supabase Auth, on success redirect; on error set inline message.
- **Validation conditions:** Sign in: email non-empty and valid format, password non-empty. Create account: email non-empty and valid format, password min 8 characters (or per Supabase rules), password confirmation matches password. Block submit until valid; show inline errors for invalid fields.
- **Types:** No API DTOs (Supabase Auth). ViewModel: `AuthMode` (`'signin' | 'register'`), form state (email, password, confirmPassword for register), `errorMessage: string | null`.
- **Props:** Optional `redirect?: string` (from URL query; validated against allowed routes before redirect).

### SignInForm

- **Description:** Form with email and password inputs and a "Sign in" / "Login" button. Password input is masked.
- **Main elements:** `form`, labeled email input (type email), labeled password input (type password), submit button "Sign in" or "Login", optional aria-describedby for error area.
- **Handled events:** Submit (prevent default, validate, call `signInWithPassword`, redirect or set error).
- **Validation:** Email required and valid format; password required. Inline error messages; do not expose raw API/technical errors (map to "Invalid email or password" for auth failures).
- **Types:** Local state: `email: string`, `password: string`; receive `onSuccess`, `onError(message: string)` from parent or container.
- **Props:** `onSubmit` or parent provides submit handler; `errorMessage?: string | null` for display.

### CreateAccountForm

- **Description:** Form with email, password, and password confirmation; "Create account" / "Register" button. Password and confirmation masked.
- **Main elements:** `form`, labeled email input, labeled password input, labeled password confirmation input, submit button "Create account" or "Register".
- **Handled events:** Submit (prevent default, validate, call `signUp`, redirect or set error).
- **Validation:** Email required and valid format; password required and min 8 characters (align with Supabase); password confirmation must match password. Map API errors to user-friendly messages (e.g. "Email already registered", "Password too weak").
- **Types:** Local state: `email`, `password`, `confirmPassword`; receive callbacks from parent.
- **Props:** Same pattern as SignInForm; `errorMessage?: string | null`.

### ModeSwitcher

- **Description:** Tabs or toggle to switch between "Sign in" and "Create account". Manages focus on mode change for accessibility.
- **Main elements:** TabsList with TabsTrigger "Sign in" and "Create account", or a toggle group. Ensure active state reflects current mode.
- **Handled events:** Change mode; on change, clear inline error and move focus to first form field of the active form.
- **Types:** `mode: AuthMode`, `onModeChange: (mode: AuthMode) => void`.
- **Props:** `value: AuthMode`, `onValueChange: (value: AuthMode) => void`.

### InlineErrorArea

- **Description:** Displays validation and API error messages. Must be visible to screen readers (e.g. `role="alert"` or `aria-live="polite"`).
- **Main elements:** Container (e.g. `div` or `Alert`) with error text; hidden when no error.
- **Handled events:** None (display only).
- **Types:** `message: string | null`.
- **Props:** `message: string | null`.

## 5. Types

- **AuthMode:** `'signin' | 'register'` — which form is active.
- **AuthFormState (ViewModel):** `{ mode: AuthMode; email: string; password: string; confirmPassword: string; errorMessage: string | null }` — local UI state.
- No backend DTOs for this view; use Supabase Auth client types where needed (`SignInWithPasswordCredentials`, `SignUpWithPasswordCredentials`). Redirect target: validate against allowed routes `['/', '/meal-plan', '/shopping-list']` before redirect.

## 6. State Management

- **State:** Mode (signin | register), email, password, confirmPassword, errorMessage. No custom hook required for MVP; state can live in AuthFormContainer (useState). Clear errorMessage when switching mode or when user edits a field (optional).
- **Persistence:** None. Redirect URL param `redirect` is read from the URL on load and used only after successful auth.
- **Auth:** Use Supabase client (e.g. from `@/db/supabase.client` or Astro/Supabase auth helpers). Call `signInWithPassword({ email, password })` or `signUp({ email, password })`; on success, redirect; on error, set user-friendly `errorMessage` (e.g. "Invalid email or password", "Email already registered", "Password should be at least 8 characters").

## 7. API Integration

This view does not use the application’s REST API. It uses **Supabase Auth** only:

- **Sign in:** `supabase.auth.signInWithPassword({ email, password })`. On success: redirect to `redirect` (if valid) or `/`. On error: map to "Invalid email or password" (do not expose raw error).
- **Register:** `supabase.auth.signUp({ email, password })`. On success: redirect same as sign in (user is logged in after signup). On error: map to user-friendly messages (e.g. "Email already registered", "Password should be at least 8 characters").
- **Redirect validation:** Only redirect to `'/','/meal-plan','/shopping-list'`. Ignore or sanitize any other `redirect` value (e.g. redirect to `/`).

## 8. User Interactions

- **Switch mode:** User clicks "Create account" or "Sign in" tab/toggle → mode updates, error cleared, focus moves to first field of active form.
- **Sign in submit:** User fills email and password, clicks "Sign in" → validate → `signInWithPassword` → on success redirect; on failure show "Invalid email or password".
- **Create account submit:** User fills email, password, confirmation, clicks "Create account" → validate (match confirmation, min length) → `signUp` → on success redirect; on failure show mapped message (e.g. email exists, weak password).
- **Focus management:** On mode switch, move focus to first input of the visible form. Ensure all inputs have visible labels.

## 9. Conditions and Validation

- **Client-side (before submit):** Email non-empty and valid format; password non-empty; for register: password ≥ 8 characters (or per Supabase config), confirmation matches. Block submit and show inline errors until valid.
- **After auth error:** Map Supabase error codes/messages to user-facing copy only (e.g. invalid credentials → "Invalid email or password"; email already in use → "An account with this email already exists").
- **Redirect:** Use `redirect` only if it is one of `['/', '/meal-plan', '/shopping-list']`; otherwise redirect to `/`.

## 10. Error Handling

- **Validation errors:** Show inline next to fields or in shared error area; clear when user corrects input or switches mode.
- **Auth errors:** Never expose raw API or technical errors. Map to: "Invalid email or password" (sign in), "An account with this email already exists", "Password should be at least 8 characters", or a generic "Something went wrong. Please try again."
- **Network/unknown errors:** Show generic message; optionally log in console for debugging.
- **No "Forgot password" link for MVP** (per UI plan).

## 11. Implementation Steps

1. Create Astro page `src/pages/login.astro`: read `redirect` from URL query; render layout without nav bar; mount AuthFormContainer (React) with `client:load`, pass `redirect` if valid.
2. Add Supabase client (or auth helpers) for browser so the login page can call `signInWithPassword` and `signUp`. Ensure env (e.g. `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) is available on the client if needed.
3. Implement AuthFormContainer: state for mode, email, password, confirmPassword, errorMessage; ModeSwitcher; conditionally render SignInForm or CreateAccountForm; InlineErrorArea; redirect helper that validates `redirect` against allowed routes.
4. Implement ModeSwitcher (Tabs or Toggle), wire to mode state; on change clear error and focus first field of active form.
5. Implement SignInForm: controlled email/password inputs, submit handler (validate → signInWithPassword → redirect or set error). Use Shadcn Input and Button; labels for accessibility.
6. Implement CreateAccountForm: email, password, password confirmation; validate (match, min length) then signUp; same error handling and redirect.
7. Implement InlineErrorArea: display `errorMessage` with `role="alert"` (or `aria-live`).
8. Map Supabase auth errors to user-facing messages in a small helper; use it in both submit handlers.
9. Add redirect logic: after successful sign in or sign up, navigate to validated `redirect` or `/` (e.g. `window.location.href` or Astro/router if SPA).
10. Ensure middleware redirects unauthenticated users to `/login` with optional `?redirect=` for the current path; ensure login page does not show nav bar per UI plan.
11. Test: sign in with valid/invalid credentials, register with new/duplicate email, weak password, wrong confirmation; verify redirect to `/` and to `?redirect=/meal-plan`; verify focus management on mode switch.
