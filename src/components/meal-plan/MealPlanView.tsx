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

const DEFAULT_RATE_LIMIT_COOLDOWN_SEC = 45;

export type MealPlanError = {
  kind: "retry" | "rate_limit";
  message: string;
  /** Suggested wait time in seconds (for rate_limit). */
  retryAfterSeconds?: number;
  /** Optional hint from API (e.g. for 503 config). */
  hint?: string;
};

const ERROR_RETRY_MESSAGE =
  "Unable to generate meal plan. Please try again in a moment.";

export function MealPlanView() {
  const { mealPlan, prompt, setMealPlanAndList, hydrate } = useMealPlanStorage();
  const [hasProducts, setHasProducts] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MealPlanError | null>(null);
  const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);

  const fetchProductsCheck = useCallback(async () => {
    const res = await authFetch("/api/products?limit=1");
    if (!res.ok) return;
    const json = (await res.json()) as PaginatedResponse<ProductDto>;
    setHasProducts(Array.isArray(json.data) && json.data.length > 0);
  }, []);

  const fetchPromptPreview = useCallback(async () => {
    const res = await authFetch("/api/meal-plan");
    if (!res.ok) return;
    const json = (await res.json()) as { prompt: string };
    if (typeof json.prompt === "string") {
      setPreviewPrompt(json.prompt);
    }
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
      const data = (await res.json()) as
        | GenerateMealPlanResponse
        | { error?: string; retryAfter?: number; hint?: string };
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter =
            typeof (data as { retryAfter?: number }).retryAfter === "number"
              ? (data as { retryAfter: number }).retryAfter
              : DEFAULT_RATE_LIMIT_COOLDOWN_SEC;
          const baseMessage =
            (data as { error?: string }).error ??
            "The AI provider is rate-limiting requests. Please wait and try again.";
          const message =
            retryAfter > 0
              ? `${baseMessage} Try again in ${retryAfter} seconds.`
              : baseMessage;
          setError({
            kind: "rate_limit",
            message,
            retryAfterSeconds: retryAfter,
          });
          setRetryCooldownUntil(Date.now() + retryAfter * 1000);
        } else if (res.status === 502 || res.status === 503 || res.status === 504) {
          const errorData = data as { error?: string; hint?: string };
          const message = errorData.error ?? ERROR_RETRY_MESSAGE;
          setError({
            kind: "retry",
            message,
            hint: errorData.hint,
          });
        }
        setLoading(false);
        return;
      }
      const result = data as GenerateMealPlanResponse;
      if (result.mealPlan && result.shoppingList) {
        setMealPlanAndList(
          result.mealPlan,
          result.shoppingList,
          result.prompt
        );
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
    void fetchPromptPreview();
  }, [hydrate, fetchProductsCheck, fetchPromptPreview]);

  const isRetryDisabled =
    error?.kind === "rate_limit" &&
    retryCooldownUntil != null &&
    Date.now() < retryCooldownUntil;

  return (
    <main className="flex flex-col gap-6 px-4 py-6" aria-label="Meal plan">
      <PageHeader title="Meal Plan" />
      <section
        className="flex flex-col gap-2"
        aria-label="Input sent to the AI"
      >
        <label
          htmlFor="meal-plan-prompt"
          className="text-sm font-medium text-muted-foreground"
        >
          Input sent to the AI (read-only)
        </label>
        <textarea
          id="meal-plan-prompt"
          readOnly
          value={prompt ?? previewPrompt ?? ""}
          rows={12}
          className="w-full resize-y rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          aria-describedby="meal-plan-prompt-description"
        />
        <p
          id="meal-plan-prompt-description"
          className="text-xs text-muted-foreground"
        >
          This is the exact prompt sent to the AI when you click “Generate Meal
          Plan”. You cannot edit it.
        </p>
      </section>
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
            onClick={(e) => {
              if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
              e.preventDefault();
              window.location.href = "/shopping-list";
            }}
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
