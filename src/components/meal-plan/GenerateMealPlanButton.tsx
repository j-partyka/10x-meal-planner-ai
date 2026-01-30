import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface GenerateMealPlanButtonProps {
  disabled: boolean;
  onClick: () => void;
  loading?: boolean;
  "data-test-id"?: string;
}

const TOOLTIP_MESSAGE = "Add products to inventory first";

export function GenerateMealPlanButton({
  disabled,
  onClick,
  loading = false,
  "data-test-id": dataTestId,
}: GenerateMealPlanButtonProps) {
  const isDisabled = disabled || loading;

  const button = (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      data-test-id={dataTestId}
    >
      {loading ? "Generating…" : "Generate Meal Plan"}
    </Button>
  );

  if (disabled && !loading) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block cursor-not-allowed">{button}</span>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          <p>{TOOLTIP_MESSAGE}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
