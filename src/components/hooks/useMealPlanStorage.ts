import { useCallback, useState } from "react";
import type { MealPlanDto, ShoppingListDto } from "@/types";

const SESSION_STORAGE_KEY = "meal-planner-plan";

function isValidStoredPlan(
  value: unknown
): value is { mealPlan: MealPlanDto; shoppingList: ShoppingListDto } {
  if (value == null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const mealPlan = o.mealPlan;
  const shoppingList = o.shoppingList;
  if (
    mealPlan == null ||
    typeof mealPlan !== "object" ||
    !Array.isArray((mealPlan as MealPlanDto).days)
  )
    return false;
  if (
    shoppingList == null ||
    typeof shoppingList !== "object" ||
    !Array.isArray((shoppingList as ShoppingListDto).items) ||
    typeof (shoppingList as ShoppingListDto).grouped !== "object"
  )
    return false;
  return true;
}

export interface UseMealPlanStorageReturn {
  mealPlan: MealPlanDto | null;
  shoppingList: ShoppingListDto | null;
  setMealPlanAndList: (
    mealPlan: MealPlanDto,
    shoppingList: ShoppingListDto
  ) => void;
  hydrate: () => void;
}

/**
 * Hook that holds meal plan and shopping list state and syncs to sessionStorage.
 * hydrate() loads from sessionStorage; setMealPlanAndList() updates state and persists.
 */
export function useMealPlanStorage(): UseMealPlanStorageReturn {
  const [mealPlan, setMealPlan] = useState<MealPlanDto | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListDto | null>(
    null
  );

  const hydrate = useCallback(() => {
    if (typeof sessionStorage === "undefined") return;
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidStoredPlan(parsed)) return;
      setMealPlan(parsed.mealPlan);
      setShoppingList(parsed.shoppingList);
    } catch {
      // ignore
    }
  }, []);

  const setMealPlanAndList = useCallback(
    (plan: MealPlanDto, list: ShoppingListDto) => {
      setMealPlan(plan);
      setShoppingList(list);
      if (typeof sessionStorage === "undefined") return;
      try {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ mealPlan: plan, shoppingList: list })
        );
      } catch {
        // ignore
      }
    },
    []
  );

  return { mealPlan, shoppingList, setMealPlanAndList, hydrate };
}
