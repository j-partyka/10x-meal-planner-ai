/**
 * Shown when there is no meal plan in state (sessionStorage empty or invalid).
 * Directs user to generate a plan from /meal-plan or add products from / (inventory).
 */
export function NoPlanState() {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center"
      role="status"
      aria-label="No meal plan"
    >
      <p className="text-muted-foreground text-sm">
        You don&apos;t have a meal plan yet. Create one from the Meal plan page, or add products to your inventory first.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="/meal-plan"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Go to Meal plan
        </a>
        <a
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Go to Inventory
        </a>
      </div>
    </div>
  );
}
