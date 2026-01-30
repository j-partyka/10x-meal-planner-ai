import type { ShoppingListItemDto } from "@/types";

export interface ShoppingListItemRowProps {
  item: ShoppingListItemDto;
  "data-test-id"?: string;
}

function formatQuantity(item: ShoppingListItemDto): string {
  const { quantity, unit } = item;
  if (!unit || unit === "piece" || unit === "pieces") {
    return quantity === 1 ? "1 piece" : `${quantity} pieces`;
  }
  return `${quantity}${unit}`;
}

/**
 * One row: item name and required quantity (e.g. "500g", "3 pieces"). Read-only.
 */
export function ShoppingListItemRow({ item, "data-test-id": dataTestId }: ShoppingListItemRowProps) {
  const quantityText = formatQuantity(item);
  return (
    <li className="text-muted-foreground text-sm" data-test-id={dataTestId}>
      <span className="font-medium text-foreground">{item.name}</span>
      {" — "}
      <span>{quantityText}</span>
    </li>
  );
}
