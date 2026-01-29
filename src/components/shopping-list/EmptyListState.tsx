/**
 * Shown when a plan exists but the shopping list is empty (all ingredients covered by inventory).
 */
export function EmptyListState() {
  return (
    <div
      className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center"
      role="status"
      aria-label="Shopping list empty"
    >
      <p className="text-muted-foreground text-sm">
        Great! You have everything you need for this meal plan.
      </p>
    </div>
  );
}
