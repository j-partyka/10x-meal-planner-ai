import { useCallback, useState } from "react";
import type { MealPlanDto, ShoppingListDto } from "@/types";

const SESSION_STORAGE_KEY = "meal-planner-plan";

function isValidStoredPlan(value: unknown): value is {
  mealPlan: MealPlanDto;
  shoppingList: ShoppingListDto;
  prompt?: string;
} {
  if (value == null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const mealPlan = o.mealPlan;
  const shoppingList = o.shoppingList;
  if (mealPlan == null || typeof mealPlan !== "object" || !Array.isArray((mealPlan as MealPlanDto).days)) return false;
  if (
    shoppingList == null ||
    typeof shoppingList !== "object" ||
    !Array.isArray((shoppingList as ShoppingListDto).items) ||
    typeof (shoppingList as ShoppingListDto).grouped !== "object"
  )
    return false;
  if (o.prompt !== undefined && typeof o.prompt !== "string") return false;
  return true;
}

interface StoredPlan {
  mealPlan: MealPlanDto | null;
  shoppingList: ShoppingListDto | null;
  prompt: string | null;
}

let initialCache: StoredPlan | null = null;

function getInitialFromStorage(): StoredPlan {
  if (initialCache !== null) return initialCache;
  if (typeof sessionStorage === "undefined") {
    initialCache = { mealPlan: null, shoppingList: null, prompt: null };
    return initialCache;
  }
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      initialCache = { mealPlan: null, shoppingList: null, prompt: null };
      return initialCache;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidStoredPlan(parsed)) {
      initialCache = { mealPlan: null, shoppingList: null, prompt: null };
      return initialCache;
    }
    initialCache = {
      mealPlan: parsed.mealPlan,
      shoppingList: parsed.shoppingList,
      prompt: parsed.prompt ?? null,
    };
    return initialCache;
  } catch {
    initialCache = { mealPlan: null, shoppingList: null, prompt: null };
    return initialCache;
  }
}

export interface UseMealPlanStorageReturn {
  mealPlan: MealPlanDto | null;
  shoppingList: ShoppingListDto | null;
  /** Prompt sent to the LLM for the current plan (if available). */
  prompt: string | null;
  setMealPlanAndList: (mealPlan: MealPlanDto, shoppingList: ShoppingListDto, prompt?: string) => void;
  hydrate: () => void;
}

/**
 * Hook that holds meal plan and shopping list state and syncs to sessionStorage.
 * hydrate() loads from sessionStorage; setMealPlanAndList() updates state and persists.
 */
export function useMealPlanStorage(): UseMealPlanStorageReturn {
  const [mealPlan, setMealPlan] = useState<MealPlanDto | null>(() => getInitialFromStorage().mealPlan);
  const [shoppingList, setShoppingList] = useState<ShoppingListDto | null>(() => getInitialFromStorage().shoppingList);
  const [prompt, setPrompt] = useState<string | null>(() => getInitialFromStorage().prompt);

  const hydrate = useCallback(() => {
    if (typeof sessionStorage === "undefined") return;
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidStoredPlan(parsed)) return;
      setMealPlan(parsed.mealPlan);
      setShoppingList(parsed.shoppingList);
      setPrompt(parsed.prompt ?? null);
    } catch {
      // ignore
    }
  }, []);

  const setMealPlanAndList = useCallback((plan: MealPlanDto, list: ShoppingListDto, promptText?: string) => {
    setMealPlan(plan);
    setShoppingList(list);
    setPrompt(promptText ?? null);
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          mealPlan: plan,
          shoppingList: list,
          prompt: promptText ?? undefined,
        })
      );
    } catch {
      // ignore
    }
  }, []);

  return { mealPlan, shoppingList, prompt, setMealPlanAndList, hydrate };
}
