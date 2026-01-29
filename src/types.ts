/**
 * Shared types for backend and frontend: entities, DTOs, and command models.
 * DTOs and commands are derived from database entity definitions where applicable.
 */

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./db/database.types";

// =============================================================================
// Entity types (from database)
// =============================================================================

/** Product row from public.products. */
export type Product = Tables<"products">;

/** Product insert payload (database). */
export type ProductInsert = TablesInsert<"products">;

/** Product update payload (database). */
export type ProductUpdate = TablesUpdate<"products">;

/** product_unit enum from database. */
export type ProductUnit = Enums<"product_unit">;

// =============================================================================
// Product DTOs (API responses – derived from Product entity)
// =============================================================================

/**
 * Product as returned by the API (single product or list item).
 * Matches Product entity; used for GET /api/products/:id, POST/PATCH responses, and list items.
 */
export type ProductDto = Product;

// =============================================================================
// Product commands (API request bodies – derived from ProductInsert / ProductUpdate)
// =============================================================================

/**
 * Request body for POST /api/products (create product).
 * user_id and created_at are set server-side; id is generated.
 * Derived from ProductInsert by omitting server-managed fields.
 */
export type CreateProductCommand = Omit<
  ProductInsert,
  "id" | "user_id" | "created_at"
>;

/**
 * Request body for PATCH /api/products/:id (update product).
 * Partial update; only provided fields are applied. user_id must not be sent.
 * Derived from ProductUpdate by omitting id and user_id.
 */
export type UpdateProductCommand = Partial<
  Omit<ProductUpdate, "id" | "user_id">
>;

// =============================================================================
// List products (query and response)
// =============================================================================

/** Allowed sort fields for GET /api/products. */
export type ProductSortField =
  | "name"
  | "expiration_date"
  | "created_at"
  | "quantity"
  | "category";

/** Sort order for list endpoints. */
export type SortOrder = "asc" | "desc";

/**
 * Query parameters for GET /api/products.
 * search: case-insensitive on name/category; category: filter; sort/order: ordering; page/limit: pagination.
 */
export interface ListProductsQuery {
  search?: string;
  category?: string;
  sort?: ProductSortField;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

/** Pagination metadata for list responses. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper.
 * Used for GET /api/products (data: ProductDto[]).
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// =============================================================================
// Meal plan (computed resource – no DB table; types for API contract)
// =============================================================================

/** Ingredient within a meal (name, quantity, unit). Unit is string for API flexibility (may extend beyond product_unit). */
export interface MealIngredientDto {
  name: string;
  quantity: number;
  unit: string;
}

/** Single meal (breakfast/lunch/dinner): name, ingredients, instructions. */
export interface MealDto {
  name: string;
  ingredients: MealIngredientDto[];
  instructions: string[];
}

/** One day in the meal plan: date and three meals. */
export interface MealPlanDayDto {
  date: string; // YYYY-MM-DD
  breakfast: MealDto;
  lunch: MealDto;
  dinner: MealDto;
}

/** Full meal plan: 7 days. */
export interface MealPlanDto {
  days: MealPlanDayDto[];
}

// =============================================================================
// Meal plan – product input (subset of Product for AI input)
// =============================================================================

/**
 * Product-like item sent in POST /api/meal-plan request (products array).
 * Mirrors Product entity fields used by the meal-plan endpoint (no id/user_id/created_at).
 * Kept in sync with Product for consistency.
 */
export type MealPlanProductInput = Pick<
  Product,
  "name" | "quantity" | "unit" | "expiration_date" | "category"
> & {
  /** Optional product id when referencing existing inventory. */
  id?: string;
};

/**
 * Request body for POST /api/meal-plan (generate meal plan and shopping list).
 * products: optional inventory; if omitted, server fetches from DB. startDate: first day of plan (YYYY-MM-DD).
 */
export interface GenerateMealPlanCommand {
  products?: MealPlanProductInput[];
  startDate?: string; // YYYY-MM-DD
}

/** Response of POST /api/meal-plan. */
export interface GenerateMealPlanResponse {
  mealPlan: MealPlanDto;
  shoppingList: ShoppingListDto;
}

// =============================================================================
// Shopping list (computed resource – no DB table)
// =============================================================================

/** Single shopping list item (name, quantity, unit, category). */
export interface ShoppingListItemDto {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

/**
 * Shopping list: flat items array and grouped by category key.
 * categoryKey in grouped is arbitrary string (e.g. "Dairy", "Other").
 */
export interface ShoppingListDto {
  items: ShoppingListItemDto[];
  grouped: Record<string, ShoppingListItemDto[]>;
}

/**
 * Request body for POST /api/shopping-list (compute list from meal plan).
 * mealPlan: existing plan; server computes missing ingredients vs current inventory.
 */
export interface ComputeShoppingListCommand {
  mealPlan: MealPlanDto;
}

/**
 * Response of POST /api/shopping-list.
 * Same shape as ShoppingListDto (items + grouped).
 */
export type ComputeShoppingListResponse = ShoppingListDto;
