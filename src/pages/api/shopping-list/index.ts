import type { APIRoute } from "astro";

import { errorResponse, jsonResponse } from "../../../lib/api-responses";
import { logServerError, logValidationFailure } from "../../../lib/api-logger";
import { computeShoppingListCommandSchema } from "../../../lib/schemas";
import { computeShoppingList } from "../../../lib/services/shopping-list.service";
import type { InventoryItemForList } from "../../../lib/services/shopping-list.service";
import { listProducts } from "../../../lib/services/product.service";

export const prerender = false;

/**
 * Maps product row from DB to InventoryItemForList (name, quantity, unit, category).
 */
function toInventoryForList(
  rows: { name: string; quantity: number; unit: string; category: string | null }[]
): InventoryItemForList[] {
  return rows.map((row) => ({
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category ?? null,
  }));
}

/**
 * POST /api/shopping-list – Compute missing ingredients for a meal plan against current user inventory.
 * Body: mealPlan (required; days array with date, breakfast, lunch, dinner; each meal has name, ingredients, instructions).
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = computeShoppingListCommandSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    const detailsList = Object.entries(details).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    logValidationFailure("POST /api/shopping-list", detailsList);
    return errorResponse("Validation failed", 400, detailsList);
  }

  try {
    const { data: products } = await listProducts(locals.supabase, userId, {
      limit: 500,
      page: 1,
    });
    const inventory = toInventoryForList(products);
    const result = computeShoppingList(parsed.data.mealPlan, inventory);
    return jsonResponse(result, 200);
  } catch (err) {
    logServerError("POST /api/shopping-list", err);
    return errorResponse("Internal server error", 500);
  }
};
