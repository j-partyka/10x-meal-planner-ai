import { describe, it, expect } from "vitest";
import {
  uuidParamSchema,
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  generateMealPlanCommandSchema,
  computeShoppingListCommandSchema,
} from "./index";

const validUuid = "a1b2c3d4-e5f6-4780-a123-456789abcdef";

describe("schemas", () => {
  describe("uuidParamSchema", () => {
    it("accepts valid UUID v4", () => {
      const result = uuidParamSchema.safeParse({ id: validUuid });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID format", () => {
      expect(uuidParamSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
      expect(uuidParamSchema.safeParse({ id: "a1b2c3d4-e5f6-0780-a123-456789abcdef" }).success).toBe(false);
      expect(uuidParamSchema.safeParse({ id: "" }).success).toBe(false);
    });

    it("rejects missing id", () => {
      expect(uuidParamSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("listProductsQuerySchema", () => {
    it("accepts empty object and applies defaults", () => {
      const result = listProductsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("expiration_date");
        expect(result.data.order).toBe("asc");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
      }
    });

    it("accepts valid sort and order", () => {
      const result = listProductsQuerySchema.safeParse({
        sort: "name",
        order: "desc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("name");
        expect(result.data.order).toBe("desc");
      }
    });

    it("rejects invalid sort field", () => {
      expect(
        listProductsQuerySchema.safeParse({ sort: "invalid" }).success
      ).toBe(false);
    });

    it("rejects limit above 100", () => {
      expect(
        listProductsQuerySchema.safeParse({ limit: 101 }).success
      ).toBe(false);
    });

    it("accepts limit 1 and 100 (boundaries)", () => {
      expect(listProductsQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(listProductsQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    });

    it("coerces page and limit from string", () => {
      const result = listProductsQuerySchema.safeParse({
        page: "2",
        limit: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe("createProductSchema", () => {
    const validCreate = {
      name: "Milk",
      quantity: 1,
      unit: "L",
      expiration_date: "2025-12-31",
      category: "Dairy",
    };

    it("accepts valid create payload", () => {
      expect(createProductSchema.safeParse(validCreate).success).toBe(true);
    });

    it("accepts without category", () => {
      const { category: _, ...rest } = validCreate;
      expect(createProductSchema.safeParse(rest).success).toBe(true);
    });

    it("rejects empty name", () => {
      expect(
        createProductSchema.safeParse({ ...validCreate, name: "" }).success
      ).toBe(false);
    });

    it("rejects name longer than 200", () => {
      expect(
        createProductSchema.safeParse({
          ...validCreate,
          name: "a".repeat(201),
        }).success
      ).toBe(false);
    });

    it("rejects quantity zero or negative", () => {
      expect(
        createProductSchema.safeParse({ ...validCreate, quantity: 0 }).success
      ).toBe(false);
      expect(
        createProductSchema.safeParse({ ...validCreate, quantity: -1 }).success
      ).toBe(false);
    });

    it("accepts quantity with decimals (multipleOf 0.001)", () => {
      expect(
        createProductSchema.safeParse({ ...validCreate, quantity: 0.5 }).success
      ).toBe(true);
    });

    it("rejects invalid unit", () => {
      expect(
        createProductSchema.safeParse({ ...validCreate, unit: "invalid" }).success
      ).toBe(false);
    });

    it("accepts all valid units", () => {
      for (const unit of ["kg", "g", "ml", "L", "pieces"]) {
        expect(
          createProductSchema.safeParse({ ...validCreate, unit }).success
        ).toBe(true);
      }
    });

    it("rejects invalid date format", () => {
      expect(
        createProductSchema.safeParse({
          ...validCreate,
          expiration_date: "31/12/2025",
        }).success
      ).toBe(false);
      expect(
        createProductSchema.safeParse({
          ...validCreate,
          expiration_date: "not-a-date",
        }).success
      ).toBe(false);
    });

    it("rejects invalid date value (e.g. month 13)", () => {
      expect(
        createProductSchema.safeParse({
          ...validCreate,
          expiration_date: "2025-13-01",
        }).success
      ).toBe(false);
    });

    it("rejects extra properties (strict)", () => {
      expect(
        createProductSchema.safeParse({ ...validCreate, user_id: "x" }).success
      ).toBe(false);
    });
  });

  describe("updateProductSchema", () => {
    it("accepts empty object (partial update)", () => {
      expect(updateProductSchema.safeParse({}).success).toBe(true);
    });

    it("accepts partial fields", () => {
      expect(
        updateProductSchema.safeParse({ name: "New Name" }).success
      ).toBe(true);
      expect(
        updateProductSchema.safeParse({
          quantity: 2,
          expiration_date: "2025-06-01",
        }).success
      ).toBe(true);
    });

    it("accepts category null", () => {
      expect(
        updateProductSchema.safeParse({ category: null }).success
      ).toBe(true);
    });

    it("rejects name empty string", () => {
      expect(
        updateProductSchema.safeParse({ name: "" }).success
      ).toBe(false);
    });

    it("rejects quantity zero", () => {
      expect(
        updateProductSchema.safeParse({ quantity: 0 }).success
      ).toBe(false);
    });
  });

  describe("generateMealPlanCommandSchema", () => {
    it("accepts empty object", () => {
      expect(generateMealPlanCommandSchema.safeParse({}).success).toBe(true);
    });

    it("accepts optional products and startDate", () => {
      const result = generateMealPlanCommandSchema.safeParse({
        startDate: "2025-02-01",
        products: [
          {
            name: "Milk",
            quantity: 1,
            unit: "L",
            expiration_date: "2025-12-31",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid startDate", () => {
      expect(
        generateMealPlanCommandSchema.safeParse({
          startDate: "invalid",
        }).success
      ).toBe(false);
    });

    it("rejects invalid product in array", () => {
      expect(
        generateMealPlanCommandSchema.safeParse({
          products: [
            {
              name: "Milk",
              quantity: -1,
              unit: "L",
              expiration_date: "2025-12-31",
            },
          ],
        }).success
      ).toBe(false);
    });
  });

  describe("computeShoppingListCommandSchema", () => {
    const minimalMealPlan = {
      days: [
        {
          date: "2025-02-01",
          breakfast: {
            name: "B",
            ingredients: [],
            instructions: [],
          },
          lunch: {
            name: "L",
            ingredients: [],
            instructions: [],
          },
          dinner: {
            name: "D",
            ingredients: [],
            instructions: [],
          },
        },
      ],
    };

    it("accepts valid meal plan", () => {
      expect(
        computeShoppingListCommandSchema.safeParse({ mealPlan: minimalMealPlan })
          .success
      ).toBe(true);
    });

    it("rejects missing mealPlan", () => {
      expect(computeShoppingListCommandSchema.safeParse({}).success).toBe(false);
    });

    it("rejects empty days array", () => {
      expect(
        computeShoppingListCommandSchema.safeParse({
          mealPlan: { days: [] },
        }).success
      ).toBe(false);
    });

    it("rejects invalid day date", () => {
      expect(
        computeShoppingListCommandSchema.safeParse({
          mealPlan: {
            days: [
              {
                ...minimalMealPlan.days[0],
                date: "not-a-date",
              },
            ],
          },
        }).success
      ).toBe(false);
    });
  });
});
