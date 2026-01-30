import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateAccountFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage: string | null;
  errorId?: string;
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

export function CreateAccountForm({
  email,
  password,
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  errorMessage,
  errorId,
  emailInputRef,
  disabled = false,
}: CreateAccountFormProps) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(e);
    },
    [onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
      aria-describedby={errorMessage ? errorId : undefined}
      data-test-id="register-form"
    >
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          ref={emailInputRef}
          disabled={disabled}
          required
          data-test-id="register-email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled}
          required
          minLength={MIN_PASSWORD_LENGTH}
          data-test-id="register-password"
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-confirm">Confirm password</Label>
        <Input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          disabled={disabled}
          required
          minLength={MIN_PASSWORD_LENGTH}
          data-test-id="register-confirm-password"
        />
      </div>
      <Button type="submit" disabled={disabled} data-test-id="register-submit">
        Create account
      </Button>
    </form>
  );
}
