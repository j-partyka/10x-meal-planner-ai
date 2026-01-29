import type { ShoppingListDto, ShoppingListItemDto } from "@/types";
import { CategoryGroup } from "./CategoryGroup";

const OTHER_ALIASES = ["Other", "Miscellaneous"];
const OTHER_KEY = "Other";

function sortCategoryKeys(keys: string[]): string[] {
  const rest = keys.filter((k) => !OTHER_ALIASES.includes(k)).sort();
  const other = keys.filter((k) => OTHER_ALIASES.includes(k));
  return [...rest, ...other];
}

/**
 * Builds grouped map from flat items when API returns empty or missing grouped.
 * Items without a category go under "Other".
 */
function buildGroupedFromItems(items: ShoppingListItemDto[]): Record<string, ShoppingListItemDto[]> {
  const grouped: Record<string, ShoppingListItemDto[]> = {};
  for (const item of items) {
    const key = item.category?.trim() || OTHER_KEY;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  return grouped;
}

export interface GroupedShoppingListProps {
  shoppingList: ShoppingListDto;
}

/**
 * Returns total number of items in grouped map.
 */
function countGroupedItems(grouped: Record<string, ShoppingListItemDto[]>): number {
  return Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Renders shopping list grouped by category. Categories in alphabetical order; "Other" last.
 * Falls back to building grouped from items when:
 * - grouped is missing/empty, or
 * - grouped has keys but no items while items array has data (malformed API).
 */
export function GroupedShoppingList({ shoppingList }: GroupedShoppingListProps) {
  const rawGrouped = shoppingList.grouped ?? {};
  const items = shoppingList.items ?? [];
  const hasGroupedKeys = Object.keys(rawGrouped).length > 0;
  const groupedItemCount = countGroupedItems(rawGrouped);
  const useFallback =
    !hasGroupedKeys || (groupedItemCount === 0 && items.length > 0);
  const grouped = useFallback
    ? buildGroupedFromItems(items)
    : rawGrouped;
  const keys = sortCategoryKeys(Object.keys(grouped));

  if (keys.length === 0) return null;

  return (
    <section
      aria-labelledby="shopping-list-categories-heading"
      aria-label="Shopping list by category"
    >
      <h2 id="shopping-list-categories-heading" className="sr-only">
        Shopping list by category
      </h2>
      <div className="flex flex-col gap-6">
        {keys.map((categoryName, index) => (
          <CategoryGroup
            key={categoryName}
            id={`shopping-category-${index}`}
            categoryName={categoryName}
            items={grouped[categoryName] ?? []}
          />
        ))}
      </div>
    </section>
  );
}
