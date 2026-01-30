import { Button } from "@/components/ui/button";

export type MealPlanErrorKind = "retry" | "rate_limit";

export interface MealPlanErrorState {
  kind: MealPlanErrorKind;
  message: string;
  /** Optional hint from API (e.g. for 503 config). */
  hint?: string;
}

export interface ErrorStateProps {
  error: MealPlanErrorState | null;
  onRetry: () => void;
  retryDisabled?: boolean;
}

export function ErrorState({
  error,
  onRetry,
  retryDisabled = false,
}: ErrorStateProps) {
  if (!error) return null;

  return (
    <div
      className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive-foreground"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm">{error.message}</p>
      {error.hint != null && error.hint !== "" && (
        <p className="mt-1 text-xs text-muted-foreground">{error.hint}</p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={retryDisabled}
        className="mt-2"
      >
        Retry
      </Button>
    </div>
  );
}
