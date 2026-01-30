import type { APIRoute } from 'astro';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { errorResponse, jsonResponse } from '../../../lib/api-responses';
import { logServerError, logValidationFailure } from '../../../lib/api-logger';
import { generateMealPlanCommandSchema } from '../../../lib/schemas';
import { OPENROUTER_DEFAULT_MODEL } from '../../../lib/services/openrouter.config';
import {
  createOpenRouterService,
  getOpenRouterApiKey,
  isOpenRouterConfigured,
} from '../../../lib/services/openrouter';
import {
  generateMealPlan,
  getMealPlanPrompt,
} from '../../../lib/services/meal-plan.service';
import {
  MealPlanAiError,
  MealPlanRateLimitError,
} from '../../../lib/services/meal-plan.errors';
import { listProducts } from '../../../lib/services/product.service';
import type { MealPlanProductInput, ProductDto } from '../../../types';

export const prerender = false;

/** Solution C: Load .env.local into process.env so OPENROUTER_API_KEY is available in Node. */
function loadEnvLocal(): void {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const fromFile = path.join(path.resolve(__dirname, '../../../..'), '.env.local');
    const fromCwd = path.join(process.cwd(), '.env.local');
    dotenv.config({ path: fromFile });
    dotenv.config({ path: fromCwd });
  } catch {
    // ignore
  }
}

/**
 * Resolves startDate: default today or next day (YYYY-MM-DD).
 */
function resolveStartDate(startDate?: string): string {
  if (startDate) {
    return startDate;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

/**
 * Maps ProductDto to MealPlanProductInput (name, quantity, unit, expiration_date, category).
 */
function toMealPlanProductInput(row: ProductDto): MealPlanProductInput {
  return {
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    expiration_date: row.expiration_date,
    category: row.category,
  };
}

/**
 * GET /api/meal-plan – Returns the exact prompt that will be sent to the AI when generating a plan.
 * Uses current user's inventory and optional startDate query param (YYYY-MM-DD).
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  const startDate = resolveStartDate(url.searchParams.get('startDate') ?? undefined);

  try {
    const { data } = await listProducts(locals.supabase, userId, {
      limit: 500,
      page: 1,
    });
    const products = data.map(toMealPlanProductInput);
    const prompt = getMealPlanPrompt(products, startDate);
    return jsonResponse({ prompt }, 200);
  } catch (err) {
    logServerError('GET /api/meal-plan (prompt)', err);
    return errorResponse('Internal server error', 500);
  }
};

/**
 * POST /api/meal-plan – Generate 7-day meal plan and shopping list.
 * Body: products? (optional; if omitted, server fetches from DB), startDate? (YYYY-MM-DD).
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = generateMealPlanCommandSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    const detailsList = Object.entries(details).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    logValidationFailure('POST /api/meal-plan', detailsList);
    return errorResponse('Validation failed', 400, detailsList);
  }

  let products: MealPlanProductInput[];
  if (parsed.data.products !== undefined && parsed.data.products.length > 0) {
    products = parsed.data.products.map((p) => ({
      ...p,
      category: p.category ?? null,
    }));
  } else if (parsed.data.products !== undefined && parsed.data.products.length === 0) {
    return errorResponse('Add products to inventory first', 422);
  } else {
    try {
      const { data } = await listProducts(locals.supabase, userId, {
        limit: 500,
        page: 1,
      });
      if (data.length === 0) {
        return errorResponse('Add products to inventory first', 422);
      }
      products = data.map(toMealPlanProductInput);
    } catch (err) {
      logServerError('POST /api/meal-plan (list products)', err);
      return errorResponse('Internal server error', 500);
    }
  }

  const startDate = resolveStartDate(parsed.data.startDate);

  loadEnvLocal();

  if (!isOpenRouterConfigured()) {
    return jsonResponse(
      {
        error: 'OpenRouter API key is not configured.',
        code: 'OPENROUTER_NOT_CONFIGURED',
        hint: 'Set OPENROUTER_API_KEY in .env.local (project root). Then run: npm run clean && npm run dev',
      },
      503
    );
  }

  const openRouter = createOpenRouterService({
    apiKey: getOpenRouterApiKey(),
    defaultModel: OPENROUTER_DEFAULT_MODEL,
    timeoutMs: 60_000,
  });

  try {
    const result = await generateMealPlan(products, startDate, openRouter);
    return jsonResponse(
      {
        mealPlan: result.mealPlan,
        shoppingList: result.shoppingList,
        prompt: result.prompt,
      },
      200
    );
  } catch (err) {
    if (err instanceof MealPlanAiError) {
      logServerError('POST /api/meal-plan (AI)', err);
      if (err instanceof MealPlanRateLimitError && err.statusCode === 429) {
        const body: { error: string; retryAfter?: number } = {
          error: err.message,
        };
        if (err.retryAfter != null) body.retryAfter = err.retryAfter;
        return jsonResponse(body, 429);
      }
      const status = err.statusCode;
      if (status === 503 || status === 502) {
        const isConfig =
          /API key|misconfigured|not configured/i.test(err.message);
        const isProviderError = /provider returned|temporarily unavailable/i.test(err.message);
        const hint = isConfig
          ? 'Set OPENROUTER_API_KEY in .env.local (project root). Then run: npm run clean && npm run dev'
          : isProviderError
            ? 'OpenRouter or the model may be temporarily unavailable. Try again in a few minutes or check https://status.openrouter.ai'
            : 'Meal plan service is temporarily unavailable. Try again later.';
        return jsonResponse(
          {
            error: err.message,
            code: isConfig ? 'OPENROUTER_NOT_CONFIGURED' : 'SERVICE_UNAVAILABLE',
            hint,
          },
          status
        );
      }
      return errorResponse(err.message, status);
    }
    logServerError('POST /api/meal-plan', err);
    return errorResponse('Internal server error', 500);
  }
};
