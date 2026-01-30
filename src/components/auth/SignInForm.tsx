import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage: string | null;
  errorId?: string;
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export function SignInForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  errorMessage,
  errorId,
  emailInputRef,
  disabled = false,
}: SignInFormProps) {
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
      data-test-id="signin-form"
    >
      <div className="grid gap-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          ref={emailInputRef}
          disabled={disabled}
          required
          data-test-id="signin-email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled}
          required
          data-test-id="signin-password"
        />
      </div>
      <Button type="submit" disabled={disabled} data-test-id="signin-submit">
        Sign in
      </Button>
    </form>
  );
}
