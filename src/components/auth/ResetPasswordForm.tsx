import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getResetPasswordValidationError } from "@/lib/auth-validation";
import { InlineErrorArea } from "./InlineErrorArea";

const MIN_PASSWORD_LENGTH = 8;

interface ResetPasswordFormProps {
  /** When true, the recovery session/token is missing or invalid — show message only. */
  invalidLink?: boolean;
}

/**
 * Set new password after recovery. Supabase session exchange + updateUser wiring comes in a later step.
 */
export function ResetPasswordForm({ invalidLink = false }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errorId = useId();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (invalidLink) return;
      const validationError = getResetPasswordValidationError(password, confirmPassword);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
      setErrorMessage(null);
      setSuccess(true);
    },
    [password, confirmPassword, invalidLink]
  );

  if (invalidLink) {
    return (
      <div className="w-full max-w-sm space-y-6" data-test-id="reset-password-invalid">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset link invalid</h1>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or expired. Request a new one.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <a href="/forgot-password">Request a new link</a>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary underline-offset-4 hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-4" data-test-id="reset-password-success">
        <div
          className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-foreground"
          role="status"
        >
          Your password has been updated. You can sign in with your new password.
        </div>
        <Button className="w-full" asChild>
          <a href="/login?reset=success">Continue to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6" data-test-id="reset-password-form-root">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4"
        noValidate
        aria-describedby={errorMessage ? errorId : undefined}
        data-test-id="reset-password-form"
      >
        <div className="grid gap-2">
          <Label htmlFor="reset-new-password">New password</Label>
          <Input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            data-test-id="reset-password-new"
          />
          <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reset-confirm-password">Confirm password</Label>
          <Input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            data-test-id="reset-password-confirm"
          />
        </div>
        <Button type="submit" data-test-id="reset-password-submit">
          Update password
        </Button>
      </form>

      <InlineErrorArea message={errorMessage} id={errorId} />

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="text-primary underline-offset-4 hover:underline" data-test-id="reset-password-back">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
