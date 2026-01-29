/**
 * Zod validation schemas for API request inputs.
 * Aligned with types in src/types.ts; use in API routes before calling services.
 */

export {
  uuidParamSchema,
  type UuidParam,
} from './common.schemas';

export {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  type ListProductsQueryInput,
  type CreateProductInput,
  type UpdateProductInput,
} from './product.schemas';

export {
  generateMealPlanCommandSchema,
  computeShoppingListCommandSchema,
  type GenerateMealPlanCommandInput,
  type ComputeShoppingListCommandInput,
} from './meal-plan.schemas';
