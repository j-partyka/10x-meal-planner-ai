import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { useMealPlanStorage } from "@/components/hooks/useMealPlanStorage";
import { PageHeader } from "@/components/inventory/PageHeader";
import { GenerateMealPlanButton } from "./GenerateMealPlanButton";
import { RegenerateAllButton } from "./RegenerateAllButton";
import { MealPlanEmptyState } from "./MealPlanEmptyState";
import { MealPlanEmptyStateWithInventory } from "./MealPlanEmptyStateWithInventory";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { MealPlanTable } from "./MealPlanTable";
import type {
  GenerateMealPlanResponse,
  PaginatedResponse,
  ProductDto,
} from "@/types";

const RETRY_COOLDOWN_MS = 45_000; // 45 seconds for 429

export type MealPlanError = {
  kind: "retry" | "rate_limit";
  message: string;
};

const ERROR_RETRY_MESSAGE =
  "Unable to generate meal plan. Please try again in a moment.";
const ERROR_RATE_LIMIT_MESSAGE =
  "Too many requests, please try again later.";

export function MealPlanView() {
  const { mealPlan, setMealPlanAndList, hydrate } = useMealPlanStorage();
  const [hasProducts, setHasProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MealPlanError | null>(null);
  const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);

  const fetchProductsCheck = useCallback(async () => {
    const res = await authFetch("/api/products?limit=1");
    if (!res.ok) return;
    const json = (await res.json()) as PaginatedResponse<ProductDto>;
    setHasProducts(Array.isArray(json.data) && json.data.length > 0);
  }, []);

  const generate = useCallback(async () => {
    if (retryCooldownUntil != null && Date.now() < retryCooldownUntil) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authFetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as GenerateMealPlanResponse | { error?: string };
      if (!res.ok) {
        if (res.status === 429) {
          setError({
            kind: "rate_limit",
            message: ERROR_RATE_LIMIT_MESSAGE,
          });
          setRetryCooldownUntil(Date.now() + RETRY_COOLDOWN_MS);
        } else if (res.status === 502 || res.status === 503 || res.status === 504) {
          setError({
            kind: "retry",
            message: ERROR_RETRY_MESSAGE,
          });
        }
        setLoading(false);
        return;
      }
      const result = data as GenerateMealPlanResponse;
      if (result.mealPlan && result.shoppingList) {
        setMealPlanAndList(result.mealPlan, result.shoppingList);
      }
      setError(null);
    } catch {
      setError({
        kind: "retry",
        message: ERROR_RETRY_MESSAGE,
      });
    } finally {
      setLoading(false);
    }
  }, [retryCooldownUntil]);

  useEffect(() => {
    hydrate();
    void fetchProductsCheck();
  }, [hydrate, fetchProductsCheck]);

  const isRetryDisabled =
    error?.kind === "rate_limit" &&
    retryCooldownUntil != null &&
    Date.now() < retryCooldownUntil;

  return (
    <main className="flex flex-col gap-6 px-4 py-6" aria-label="Meal plan">
      <PageHeader title="Meal Plan" />
      <div className="flex flex-wrap items-center gap-3">
        <GenerateMealPlanButton
          disabled={!hasProducts}
          onClick={generate}
          loading={loading}
        />
        {mealPlan != null && (
          <RegenerateAllButton onClick={generate} loading={loading} />
        )}
        {mealPlan != null && (
          <a
            href="/shopping-list"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Shopping list
          </a>
        )}
      </div>
      {loading && <LoadingState />}
      {error && (
        <ErrorState
          error={error}
          onRetry={generate}
          retryDisabled={isRetryDisabled || loading}
        />
      )}
      {!loading && !mealPlan && !hasProducts && !error && (
        <MealPlanEmptyState />
      )}
      {!loading && !mealPlan && hasProducts && !error && (
        <MealPlanEmptyStateWithInventory />
      )}
      {!loading && mealPlan && <MealPlanTable mealPlan={mealPlan} />}
    </main>
  );
}
