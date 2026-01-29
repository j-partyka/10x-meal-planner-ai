/**
 * Maps Supabase Auth errors to user-facing messages.
 * Never expose raw API or technical errors to the user.
 */

const SIGN_IN_MESSAGE = "Invalid email or password.";
const EMAIL_EXISTS_MESSAGE = "An account with this email already exists.";
const WEAK_PASSWORD_MESSAGE = "Password should be at least 8 characters.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/** Map sign-in (signInWithPassword) errors to a single user message. */
export function mapSignInError(error: unknown): string {
  // Supabase may return AuthApiError with message/code; we never expose details.
  if (import.meta.env.DEV && error != null) {
    console.debug("[auth] sign-in error (not exposed to user):", error);
  }
  return SIGN_IN_MESSAGE;
}

/** Map sign-up (signUp) errors to user-friendly messages. */
export function mapSignUpError(error: unknown): string {
  if (error == null || typeof error !== "object") return GENERIC_MESSAGE;

  const err = error as { message?: string; code?: string; status?: number };
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();

  if (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("user already registered") ||
    code === "user_already_exists" ||
    err.status === 422
  ) {
    return EMAIL_EXISTS_MESSAGE;
  }

  if (
    msg.includes("password") &&
    (msg.includes("8") || msg.includes("length") || msg.includes("least"))
  ) {
    return WEAK_PASSWORD_MESSAGE;
  }

  if (code === "weak_password" || msg.includes("password should be")) {
    return WEAK_PASSWORD_MESSAGE;
  }

  if (import.meta.env.DEV) {
    console.debug("[auth] sign-up error (not exposed to user):", error);
  }
  return GENERIC_MESSAGE;
}
