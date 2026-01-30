import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { useMealPlanStorage } from "@/components/hooks/useMealPlanStorage";
import { PageHeader } from "@/components/inventory/PageHeader";
import { Button } from "@/components/ui/button";
import type { ComputeShoppingListCommand, ComputeShoppingListResponse } from "@/types";
import { NoPlanState } from "./NoPlanState";
import { EmptyListState } from "./EmptyListState";
import { GroupedShoppingList } from "./GroupedShoppingList";

export function ShoppingListView() {
  const { mealPlan, shoppingList, setMealPlanAndList, hydrate } = useMealPlanStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShoppingList = useCallback(
    async (plan: NonNullable<typeof mealPlan>) => {
      setError(null);
      setLoading(true);
      try {
        const body: ComputeShoppingListCommand = { mealPlan: plan };
        const res = await authFetch("/api/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 401) {
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ComputeShoppingListResponse | { error?: string };
        if (!res.ok) {
          if (res.status === 400) {
            setError("Invalid meal plan. Please generate a new plan.");
          } else if (res.status === 500) {
            setError("Something went wrong. Please try again.");
          }
          setLoading(false);
          return;
        }

        const result = data as ComputeShoppingListResponse;
        setMealPlanAndList(plan, result);
      } catch {
        setError("Unable to load shopping list. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setMealPlanAndList]
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (mealPlan == null) return;
    void fetchShoppingList(mealPlan);
  }, [mealPlan, fetchShoppingList]);

  const handleRefresh = useCallback(() => {
    if (mealPlan == null || loading) return;
    void fetchShoppingList(mealPlan);
  }, [mealPlan, loading, fetchShoppingList]);

  const mainLabelId = "shopping-list-page-title";

  if (mealPlan == null) {
    return (
      <main className="flex flex-col gap-6 px-4 py-6" aria-labelledby={mainLabelId} data-test-id="shopping-list-page">
        <PageHeader title="Shopping List" titleId={mainLabelId} />
        <NoPlanState />
      </main>
    );
  }

  if (loading && shoppingList == null) {
    return (
      <main className="flex flex-col gap-6 px-4 py-6" aria-labelledby={mainLabelId} data-test-id="shopping-list-page">
        <PageHeader title="Shopping List" titleId={mainLabelId} />
        <div
          className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-test-id="shopping-list-loading"
        >
          Loading shopping list…
        </div>
      </main>
    );
  }

  if (error && shoppingList == null) {
    return (
      <main className="flex flex-col gap-6 px-4 py-6" aria-labelledby={mainLabelId} data-test-id="shopping-list-page">
        <PageHeader title="Shopping List" titleId={mainLabelId} />
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-6 py-4 text-destructive text-sm"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-test-id="shopping-list-error"
        >
          {error}
        </div>
      </main>
    );
  }

  const isEmpty = shoppingList != null && shoppingList.items.length === 0;

  return (
    <main className="flex flex-col gap-6 px-4 py-6" aria-labelledby={mainLabelId} data-test-id="shopping-list-page">
      <PageHeader title="Shopping List" titleId={mainLabelId} />
      <div className="flex flex-wrap items-center gap-3">
        {mealPlan != null && shoppingList != null && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleRefresh}
            aria-busy={loading}
            data-test-id="shopping-list-refresh"
          >
            {loading ? "Updating…" : "Refresh list"}
          </Button>
        )}
      </div>
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-6 py-4 text-destructive text-sm"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-test-id="shopping-list-error"
        >
          {error}
        </div>
      )}
      {loading && shoppingList != null && (
        <p className="text-muted-foreground text-sm" role="status" aria-live="polite" aria-atomic="true">
          Updating list…
        </p>
      )}
      {!loading && shoppingList != null && isEmpty && <EmptyListState data-test-id="shopping-list-empty" />}
      {!loading && shoppingList != null && !isEmpty && (
        <GroupedShoppingList shoppingList={shoppingList} data-test-id="shopping-list-grouped" />
      )}
    </main>
  );
}
