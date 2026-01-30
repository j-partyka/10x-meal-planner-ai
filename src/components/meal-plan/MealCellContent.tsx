import type { MealDto } from "@/types";

export interface MealCellContentProps {
  meal: MealDto;
  "data-test-id"?: string;
}

/**
 * Renders one meal: dish name, ingredients (name - quantity unit), instructions as bullets.
 * Text wraps; long lists scroll inside the cell without full-page horizontal scroll.
 */
export function MealCellContent({ meal, "data-test-id": dataTestId }: MealCellContentProps) {
  return (
    <div className="min-w-0 max-h-[280px] space-y-2 overflow-y-auto text-left" data-test-id={dataTestId}>
      <p className="font-medium text-foreground text-sm leading-tight">{meal.name}</p>
      {meal.ingredients.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground text-sm" aria-label="Ingredients">
          {meal.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.name} – {ing.quantity} {ing.unit}
            </li>
          ))}
        </ul>
      )}
      {meal.instructions.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground text-sm" aria-label="Instructions">
          {meal.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
