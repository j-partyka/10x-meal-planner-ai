import { Button } from "@/components/ui/button";

const INVENTORY_PATH = "/";

export interface MealPlanEmptyStateProps {
  "data-test-id"?: string;
}

/**
 * Empty state when there is no meal plan and inventory is empty.
 * Directs user to add products; CTA to inventory (/).
 */
export function MealPlanEmptyState({ "data-test-id": dataTestId }: MealPlanEmptyStateProps = {}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12 text-center"
      role="status"
      aria-label="No meal plan, empty inventory"
      data-test-id={dataTestId}
    >
      <p className="text-muted-foreground text-sm">
        Add products to your inventory first, then generate your meal plan.
      </p>
      <Button type="button" asChild>
        <a href={INVENTORY_PATH} data-test-id="meal-plan-empty-go-to-inventory">
          Go to Inventory
        </a>
      </Button>
    </div>
  );
}
