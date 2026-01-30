import { Button } from "@/components/ui/button";

export interface RegenerateAllButtonProps {
  onClick: () => void;
  loading?: boolean;
  "data-test-id"?: string;
}

export function RegenerateAllButton({
  onClick,
  loading = false,
  "data-test-id": dataTestId,
}: RegenerateAllButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
      data-test-id={dataTestId}
    >
      {loading ? "Generating…" : "Regenerate All"}
    </Button>
  );
}
