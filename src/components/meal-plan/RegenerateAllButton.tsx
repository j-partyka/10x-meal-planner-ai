import { Button } from "@/components/ui/button";

export interface RegenerateAllButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function RegenerateAllButton({
  onClick,
  loading = false,
}: RegenerateAllButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Generating…" : "Regenerate All"}
    </Button>
  );
}
