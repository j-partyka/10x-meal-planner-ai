import type { APIRoute } from 'astro';

import { errorResponse, jsonResponse } from '../../../lib/api-responses';
import { logServerError, logValidationFailure } from '../../../lib/api-logger';
import { generateMealPlanCommandSchema } from '../../../lib/schemas';
import { generateMealPlan } from '../../../lib/services/meal-plan.service';
import { MealPlanAiError } from '../../../lib/services/meal-plan.errors';
import { listProducts } from '../../../lib/services/product.service';
import type { MealPlanProductInput, ProductDto } from '../../../types';

export const prerender = false;

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

  try {
    const result = await generateMealPlan(products, startDate);
    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof MealPlanAiError) {
      logServerError('POST /api/meal-plan (AI)', err);
      return errorResponse(err.message, err.statusCode);
    }
    logServerError('POST /api/meal-plan', err);
    return errorResponse('Internal server error', 500);
  }
};
