import { z } from 'zod';

const productUnitEnum = z.enum(['kg', 'g', 'ml', 'L', 'pieces']);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(
    (s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime());
    },
    { message: 'Invalid date' }
  );

/** Product-like item in POST /api/meal-plan body (products array). */
const mealPlanProductInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    quantity: z.number().positive().multipleOf(0.001),
    unit: productUnitEnum,
    expiration_date: dateStringSchema,
    category: z.string().max(100).optional().nullable(),
  })
  .strict();

/** Request body for POST /api/meal-plan. */
export const generateMealPlanCommandSchema = z
  .object({
    products: z.array(mealPlanProductInputSchema).optional(),
    startDate: dateStringSchema.optional(),
  })
  .strict();

export type GenerateMealPlanCommandInput = z.infer<typeof generateMealPlanCommandSchema>;

/** Ingredient within a meal. */
const mealIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: z.string(),
});

/** Single meal (breakfast/lunch/dinner). */
const mealSchema = z.object({
  name: z.string(),
  ingredients: z.array(mealIngredientSchema),
  instructions: z.array(z.string()),
});

/** One day in the meal plan. */
const mealPlanDaySchema = z.object({
  date: dateStringSchema,
  breakfast: mealSchema,
  lunch: mealSchema,
  dinner: mealSchema,
});

/** Full meal plan (days array). */
const mealPlanDtoSchema = z.object({
  days: z.array(mealPlanDaySchema).min(1, 'Meal plan must have at least one day'),
});

/** Request body for POST /api/shopping-list. */
export const computeShoppingListCommandSchema = z
  .object({
    mealPlan: mealPlanDtoSchema,
  })
  .strict();

export type ComputeShoppingListCommandInput = z.infer<typeof computeShoppingListCommandSchema>;
