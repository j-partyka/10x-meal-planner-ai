import type {
  MealPlanDto,
  ShoppingListItemDto,
  ShoppingListDto,
} from '../../types';

/** Inventory item shape used for computing missing ingredients (name, quantity, unit, optional category). */
export interface InventoryItemForList {
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
}

const UNCATEGORIZED_KEY = 'Other';

const key = (name: string, unit: string) => `${name.toLowerCase().trim()}|${unit}`;

/**
 * Extracts all ingredients from the meal plan and aggregates quantities by (name, unit).
 * Keeps one display name per key (first occurrence).
 */
function aggregateNeeded(
  mealPlan: MealPlanDto
): Map<string, { quantity: number; unit: string; name: string }> {
  const map = new Map<string, { quantity: number; unit: string; name: string }>();

  for (const day of mealPlan.days) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      for (const ing of meal.ingredients ?? []) {
        const k = key(ing.name, ing.unit);
        const existing = map.get(k);
        if (existing) {
          existing.quantity += ing.quantity;
        } else {
          map.set(k, { quantity: ing.quantity, unit: ing.unit, name: ing.name.trim() });
        }
      }
    }
  }
  return map;
}

/**
 * Builds a map of (name, unit) -> category from inventory (last seen category for that name/unit).
 */
function inventoryCategoryMap(
  inventory: InventoryItemForList[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of inventory) {
    const k = key(item.name, item.unit);
    const cat = item.category?.trim();
    if (cat) {
      map.set(k, cat);
    }
  }
  return map;
}

/**
 * Subtracts inventory quantities from needed (by name/unit). Returns map of key -> still needed quantity and name.
 */
function subtractInventory(
  needed: Map<string, { quantity: number; unit: string; name: string }>,
  inventory: InventoryItemForList[]
): Map<string, { quantity: number; unit: string; name: string }> {
  const remaining = new Map<string, { quantity: number; unit: string; name: string }>();

  for (const [k, { quantity, unit, name }] of needed) {
    let need = quantity;
    for (const item of inventory) {
      if (key(item.name, item.unit) === k) {
        need -= item.quantity;
        if (need <= 0) break;
      }
    }
    if (need > 0) {
      remaining.set(k, { quantity: need, unit, name });
    }
  }
  return remaining;
}

/**
 * Computes the shopping list (missing ingredients) from the meal plan and current inventory.
 * Aggregates quantities by (name, unit), subtracts inventory, groups by category (uncategorized → "Other").
 */
export function computeShoppingList(
  mealPlan: MealPlanDto,
  inventory: InventoryItemForList[]
): ShoppingListDto {
  const needed = aggregateNeeded(mealPlan);
  const categoryMap = inventoryCategoryMap(inventory);
  const remaining = subtractInventory(needed, inventory);

  const items: ShoppingListItemDto[] = [];
  for (const [, { quantity, unit, name }] of remaining) {
    const k = key(name, unit);
    const category = categoryMap.get(k) ?? UNCATEGORIZED_KEY;
    items.push({ name, quantity, unit, category });
  }

  const grouped: Record<string, ShoppingListItemDto[]> = {};
  for (const item of items) {
    const cat = item.category || UNCATEGORIZED_KEY;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return { items, grouped };
}
