import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  "data-test-id"?: string;
}

const DEFAULT_MESSAGE = "Generating your meal plan…";

export function LoadingState({ message = DEFAULT_MESSAGE, "data-test-id": dataTestId }: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12"
      role="status"
      aria-live="polite"
      aria-label={message}
      data-test-id={dataTestId}
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
