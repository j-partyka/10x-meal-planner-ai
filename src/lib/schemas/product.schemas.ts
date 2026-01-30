import { z } from "zod";

const productUnitEnum = z.enum(["kg", "g", "ml", "L", "pieces"]);

const productSortFieldEnum = z.enum(["name", "expiration_date", "created_at", "quantity", "category"]);

const sortOrderEnum = z.enum(["asc", "desc"]);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine(
    (s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime());
    },
    { message: "Invalid date" }
  );

/** Query params for GET /api/products. */
export const listProductsQuerySchema = z
  .object({
    search: z.string().optional(),
    category: z.string().optional(),
    sort: productSortFieldEnum.default("expiration_date"),
    order: sortOrderEnum.default("asc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;

/** Request body for POST /api/products. user_id is set server-side; do not send. */
export const createProductSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    quantity: z.number().positive("Quantity must be greater than 0").multipleOf(0.001),
    unit: productUnitEnum,
    expiration_date: dateStringSchema,
    category: z.string().max(100).optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;

/** Request body for PATCH /api/products/:id. Partial create; user_id must not be sent. */
export const updateProductSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    quantity: z.number().positive().multipleOf(0.001).optional(),
    unit: productUnitEnum.optional(),
    expiration_date: dateStringSchema.optional(),
    category: z.string().max(100).optional().nullable(),
  })
  .strict();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
