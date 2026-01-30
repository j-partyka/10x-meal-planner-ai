import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type ExpirationStatus = "expired" | "urgent" | "warning" | "normal";

function getExpirationStatus(expirationDate: string): ExpirationStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let exp: Date;
  try {
    exp = new Date(expirationDate + "T00:00:00");
  } catch {
    return "normal";
  }
  exp.setHours(0, 0, 0, 0);

  const diffMs = exp.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "urgent";
  if (diffDays <= 7) return "warning";
  return "normal";
}

const statusConfig: Record<
  ExpirationStatus,
  { label: string; className: string; symbol: string }
> = {
  expired: {
    label: "Expired",
    className: "text-muted-foreground line-through",
    symbol: "⊗",
  },
  urgent: {
    label: "Expires soon",
    className: "text-destructive font-medium",
    symbol: "!",
  },
  warning: {
    label: "Expires in a week",
    className: "text-amber-600 dark:text-amber-500 font-medium",
    symbol: "◐",
  },
  normal: {
    label: "",
    className: "text-muted-foreground",
    symbol: "○",
  },
};

export interface ExpirationIndicatorProps {
  expirationDate: string;
  className?: string;
  "data-test-id"?: string;
}

export function ExpirationIndicator({
  expirationDate,
  className,
  "data-test-id": dataTestId,
}: ExpirationIndicatorProps) {
  const status = useMemo(
    () => getExpirationStatus(expirationDate),
    [expirationDate]
  );

  const config = statusConfig[status];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", config.className, className)}
      title={config.label || undefined}
      aria-label={config.label ? `Expiration: ${config.label}` : "Expiration: OK"}
      data-test-id={dataTestId}
    >
      <span aria-hidden>{config.symbol}</span>
      {config.label ? (
        <span className="sr-only sm:not-sr-only">{config.label}</span>
      ) : null}
    </span>
  );
}
