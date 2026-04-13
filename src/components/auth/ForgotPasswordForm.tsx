import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getForgotPasswordEmailValidationError } from "@/lib/auth-validation";
import { InlineErrorArea } from "./InlineErrorArea";

/**
 * Password reset request UI. Submission wiring (e.g. resetPasswordForEmail) is added in a later step.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const errorId = useId();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = getForgotPasswordEmailValidationError(email);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
      setErrorMessage(null);
      setSubmitted(true);
    },
    [email]
  );

  if (submitted) {
    return (
      <div className="w-full max-w-sm space-y-4" data-test-id="forgot-password-success">
        <div
          className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-foreground"
          role="status"
        >
          If an account exists, we sent a link to reset your password.
        </div>
        <Button variant="outline" className="w-full" asChild>
          <a href="/login">Back to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6" data-test-id="forgot-password-form-root">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link if an account exists.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4"
        noValidate
        aria-describedby={errorMessage ? errorId : undefined}
        data-test-id="forgot-password-form"
      >
        <div className="grid gap-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-test-id="forgot-password-email"
          />
        </div>
        <Button type="submit" data-test-id="forgot-password-submit">
          Send reset link
        </Button>
      </form>

      <InlineErrorArea message={errorMessage} id={errorId} />

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="text-primary underline-offset-4 hover:underline" data-test-id="forgot-password-back">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
