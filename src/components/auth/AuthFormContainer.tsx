import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabaseBrowser } from "@/db/supabase.browser";
import { mapSignInError, mapSignUpError } from "@/lib/auth-errors";
import { getRegisterValidationError, getSignInValidationError } from "@/lib/auth-validation";
import type { AuthMode } from "@/types";
import { isAllowedRedirect } from "@/types";
import { CreateAccountForm } from "./CreateAccountForm";
import { InlineErrorArea } from "./InlineErrorArea";
import { ModeSwitcher } from "./ModeSwitcher";
import { SignInForm } from "./SignInForm";

interface AuthFormContainerProps {
  redirect?: string;
  /** Shown after password reset when user lands on `/login?reset=success`. */
  showPasswordResetSuccess?: boolean;
}

/** After successful sign in/sign up: navigate to validated redirect or /. */
function getRedirectTarget(redirect: string | undefined): string {
  return redirect && isAllowedRedirect(redirect) ? redirect : "/";
}

export function AuthFormContainer({ redirect, showPasswordResetSuccess = false }: AuthFormContainerProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorId = useId();
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const handleModeChange = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [mode]);

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = getSignInValidationError(email, password);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        setIsSubmitting(false);
        if (error) {
          setErrorMessage(mapSignInError(error));
          return;
        }
        window.location.href = getRedirectTarget(redirect);
      } catch {
        setIsSubmitting(false);
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
    [email, password, redirect]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = getRegisterValidationError(email, password, confirmPassword);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const { error } = await supabaseBrowser.auth.signUp({
          email: email.trim(),
          password,
        });
        setIsSubmitting(false);
        if (error) {
          setErrorMessage(mapSignUpError(error));
          return;
        }
        window.location.href = getRedirectTarget(redirect);
      } catch {
        setIsSubmitting(false);
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
    [email, password, confirmPassword, redirect]
  );

  return (
    <div className="w-full max-w-sm space-y-6" data-test-id="auth-form-container">
      {showPasswordResetSuccess ? (
        <div
          className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm text-foreground"
          role="status"
          data-test-id="auth-reset-success-banner"
        >
          Your password was reset. Sign in with your new password.
        </div>
      ) : null}

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "signin"
            ? "Enter your credentials to access your meal planner."
            : "Create an account to start planning meals."}
        </p>
      </div>

      <ModeSwitcher value={mode} onValueChange={handleModeChange} data-test-id="auth-mode-switcher" />

      {mode === "signin" ? (
        <>
          <SignInForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSignIn}
            errorMessage={errorMessage}
            errorId={errorId}
            emailInputRef={emailInputRef}
            disabled={isSubmitting}
          />
          <p className="text-center text-sm">
            <a
              href="/forgot-password"
              className="text-primary underline-offset-4 hover:underline"
              data-test-id="auth-link-forgot-password"
            >
              Forgot password?
            </a>
          </p>
        </>
      ) : (
        <CreateAccountForm
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleRegister}
          errorMessage={errorMessage}
          errorId={errorId}
          emailInputRef={emailInputRef}
          disabled={isSubmitting}
        />
      )}

      <InlineErrorArea message={errorMessage} id={errorId} />
    </div>
  );
}
