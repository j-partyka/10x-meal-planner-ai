import { describe, it, expect } from "vitest";
import { computeShoppingList, type InventoryItemForList } from "./shopping-list.service";
import type { MealPlanDto } from "../../types";

/** Builds one day with ingredients only in breakfast (so totals are not tripled). */
function minimalDay(
  date: string,
  ingredients: { name: string; quantity: number; unit: string }[] = []
): MealPlanDto["days"][0] {
  const meal = (label: string, ing: { name: string; quantity: number; unit: string }[]) => ({
    name: `${label} meal`,
    ingredients: ing,
    instructions: [],
  });
  return {
    date,
    breakfast: meal("breakfast", ingredients),
    lunch: meal("lunch", []),
    dinner: meal("dinner", []),
  };
}

describe("shopping-list.service", () => {
  describe("computeShoppingList", () => {
    it("returns empty items and grouped when meal plan has no ingredients", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01"), minimalDay("2025-02-02")],
      };
      const inventory: InventoryItemForList[] = [];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toEqual([]);
      expect(result.grouped).toEqual({});
    });

    it("aggregates same ingredient across days by (name, unit)", () => {
      const mealPlan: MealPlanDto = {
        days: [
          minimalDay("2025-02-01", [
            { name: "Milk", quantity: 1, unit: "L" },
            { name: "Milk", quantity: 0.5, unit: "L" },
          ]),
          minimalDay("2025-02-02", [{ name: "Milk", quantity: 0.5, unit: "L" }]),
        ],
      };
      const inventory: InventoryItemForList[] = [];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        name: "Milk",
        quantity: 2,
        unit: "L",
      });
      expect(result.grouped["Other"]).toHaveLength(1);
    });

    it("uses first occurrence display name when aggregating (trimmed)", () => {
      const mealPlan: MealPlanDto = {
        days: [
          minimalDay("2025-02-01", [{ name: "  Flour  ", quantity: 500, unit: "g" }]),
          minimalDay("2025-02-02", [{ name: "flour", quantity: 300, unit: "g" }]),
        ],
      };
      const inventory: InventoryItemForList[] = [];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items[0].name).toBe("Flour");
      expect(result.items[0].quantity).toBe(800);
    });

    it("subtracts inventory from needed (same name and unit)", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "Eggs", quantity: 6, unit: "pieces" }])],
      };
      const inventory: InventoryItemForList[] = [{ name: "Eggs", quantity: 4, unit: "pieces" }];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        name: "Eggs",
        quantity: 2,
        unit: "pieces",
      });
    });

    it("subtracts when name/unit match after normalizing (lowercase trim)", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "Milk", quantity: 1, unit: "L" }])],
      };
      const inventory: InventoryItemForList[] = [{ name: "  milk  ", quantity: 1, unit: "L" }];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(0);
    });

    it("does not subtract when unit differs (key includes unit)", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "Milk", quantity: 1, unit: "L" }])],
      };
      const inventory: InventoryItemForList[] = [{ name: "Milk", quantity: 1, unit: "ml" }];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(1);
    });

    it("omits ingredient when inventory fully covers need", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "Butter", quantity: 200, unit: "g" }])],
      };
      const inventory: InventoryItemForList[] = [{ name: "Butter", quantity: 200, unit: "g" }];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(0);
      expect(result.grouped).toEqual({});
    });

    it("assigns category from inventory when same (name, unit) exists", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "Yogurt", quantity: 2, unit: "pieces" }])],
      };
      const inventory: InventoryItemForList[] = [{ name: "Yogurt", quantity: 0, unit: "pieces", category: "Dairy" }];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items[0].category).toBe("Dairy");
      expect(result.grouped["Dairy"]).toHaveLength(1);
    });

    it("assigns 'Other' when no inventory category for (name, unit)", () => {
      const mealPlan: MealPlanDto = {
        days: [minimalDay("2025-02-01", [{ name: "NewItem", quantity: 1, unit: "kg" }])],
      };
      const inventory: InventoryItemForList[] = [];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items[0].category).toBe("Other");
      expect(result.grouped["Other"]).toHaveLength(1);
    });

    it("builds grouped from items (each category key present)", () => {
      const mealPlan: MealPlanDto = {
        days: [
          minimalDay("2025-02-01", [
            { name: "A", quantity: 1, unit: "g" },
            { name: "B", quantity: 1, unit: "g" },
          ]),
        ],
      };
      const inventory: InventoryItemForList[] = [
        { name: "A", quantity: 0, unit: "g", category: "Produce" },
        { name: "B", quantity: 0, unit: "g", category: "Dairy" },
      ];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(2);
      expect(Object.keys(result.grouped).sort()).toEqual(["Dairy", "Produce"]);
      expect(result.grouped["Produce"]).toHaveLength(1);
      expect(result.grouped["Dairy"]).toHaveLength(1);
    });

    it("handles meal with empty or missing ingredients array", () => {
      const mealPlan: MealPlanDto = {
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
              ingredients: undefined as unknown as [],
              instructions: [],
            },
            dinner: {
              name: "D",
              ingredients: [{ name: "Salt", quantity: 1, unit: "g" }],
              instructions: [],
            },
          },
        ],
      };
      const inventory: InventoryItemForList[] = [];

      const result = computeShoppingList(mealPlan, inventory);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        name: "Salt",
        quantity: 1,
        unit: "g",
      });
    });
  });
});
