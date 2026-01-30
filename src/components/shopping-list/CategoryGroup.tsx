import type { ShoppingListItemDto } from "@/types";
import { ShoppingListItemRow } from "./ShoppingListItemRow";

export interface CategoryGroupProps {
  id?: string;
  categoryName: string;
  items: ShoppingListItemDto[];
  "data-test-id"?: string;
}

/**
 * One category section: heading and list of ShoppingListItemRow.
 * id on heading allows in-page navigation and aria-labelledby for the region.
 */
export function CategoryGroup({ id, categoryName, items, "data-test-id": dataTestId }: CategoryGroupProps) {
  if (items.length === 0) return null;

  const headingId = id ?? `category-${categoryName.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} data-test-id={dataTestId}>
      <h3 id={headingId} className="mb-2 text-lg font-semibold text-foreground">
        {categoryName}
      </h3>
      <ul className="list-inside list-disc space-y-1">
        {items.map((item, index) => (
          <ShoppingListItemRow key={`${item.name}-${index}`} item={item} data-test-id="shopping-list-item" />
        ))}
      </ul>
    </section>
  );
}
