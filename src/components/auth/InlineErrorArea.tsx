import type { ReactNode } from "react";

interface InlineErrorAreaProps {
  message: string | null;
  id?: string;
}

/** Displays validation and API error messages. Visible to screen readers via role="alert". */
export function InlineErrorArea({ message, id }: InlineErrorAreaProps): ReactNode {
  if (message == null || message === "") return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
