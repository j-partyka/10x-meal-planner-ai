export interface MealPlanEmptyStateWithInventoryProps {
  "data-test-id"?: string;
}

/**
 * Empty state when there is no meal plan but inventory has items.
 * "Generate Meal Plan" button is in the header; this component shows the short message.
 */
export function MealPlanEmptyStateWithInventory({
  "data-test-id": dataTestId,
}: MealPlanEmptyStateWithInventoryProps = {}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-10 text-center"
      role="status"
      data-test-id={dataTestId}
    >
      <p className="text-muted-foreground text-sm">Generate your weekly meal plan based on your inventory.</p>
    </div>
  );
}
