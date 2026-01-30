import { describe, it, expect } from "vitest";
import { getMealPlanPrompt } from "./meal-plan.service";
import type { MealPlanProductInput } from "../../types";

describe("meal-plan.service", () => {
  describe("getMealPlanPrompt", () => {
    it("includes start date in constraints", () => {
      const products: MealPlanProductInput[] = [];
      const startDate = "2025-02-01";

      const prompt = getMealPlanPrompt(products, startDate);

      expect(prompt).toContain("Plan starts on 2025-02-01");
      expect(prompt).toContain("Output exactly 7 consecutive days");
    });

    it("includes family profile and constraints section", () => {
      const prompt = getMealPlanPrompt([], "2025-02-01");

      expect(prompt).toContain("You are a meal planner");
      expect(prompt).toContain("**Family profile:**");
      expect(prompt).toContain("**Constraints:**");
      expect(prompt).toContain("Use only the units: kg, g, ml, L, pieces");
      expect(prompt).toContain("USE SOON");
    });

    it("renders empty inventory when products array is empty", () => {
      const prompt = getMealPlanPrompt([], "2025-02-01");

      expect(prompt).toContain("**Inventory (use these first; respect expiration priority):**");
      const afterInventory = prompt.split("**Inventory (use these first; respect expiration priority):**")[1];
      expect(afterInventory?.trim().startsWith("**Family profile:**") ?? false).toBe(true);
    });

    it("includes one product line with name, quantity, unit, expiration", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Milk",
          quantity: 1,
          unit: "L",
          expiration_date: "2025-02-10",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("- Milk: 1 L, expires 2025-02-10");
    });

    it("includes category in parentheses when present", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Yogurt",
          quantity: 2,
          unit: "pieces",
          expiration_date: "2025-02-05",
          category: "Dairy",
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("- Yogurt: 2 pieces (Dairy), expires 2025-02-05");
    });

    it("adds USE SOON when expiration is within 3 days of start date", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Fish",
          quantity: 1,
          unit: "kg",
          expiration_date: "2025-02-03",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("[USE SOON - within 3 days]");
      expect(prompt).toContain("expires 2025-02-03 [USE SOON - within 3 days]");
    });

    it("adds medium priority when expiration is within 7 days but more than 3", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Cheese",
          quantity: 200,
          unit: "g",
          expiration_date: "2025-02-06",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("[medium priority - within 7 days]");
      expect(prompt).toContain("expires 2025-02-06 [medium priority - within 7 days]");
    });

    it("adds no priority suffix when expiration is beyond 7 days", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Rice",
          quantity: 1,
          unit: "kg",
          expiration_date: "2025-03-01",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).not.toContain("[USE SOON");
      expect(prompt).not.toContain("[medium priority");
      expect(prompt).toContain("expires 2025-03-01");
    });

    it("boundary: exactly 3 days left yields USE SOON", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "X",
          quantity: 1,
          unit: "g",
          expiration_date: "2025-02-04",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("[USE SOON - within 3 days]");
    });

    it("boundary: exactly 7 days left yields medium priority", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Y",
          quantity: 1,
          unit: "g",
          expiration_date: "2025-02-08",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("[medium priority - within 7 days]");
    });

    it("multiple products appear as separate lines with correct priorities", () => {
      const products: MealPlanProductInput[] = [
        {
          name: "Soon",
          quantity: 1,
          unit: "g",
          expiration_date: "2025-02-02",
          category: null,
        },
        {
          name: "Medium",
          quantity: 1,
          unit: "g",
          expiration_date: "2025-02-06",
          category: null,
        },
        {
          name: "Later",
          quantity: 1,
          unit: "g",
          expiration_date: "2025-02-15",
          category: null,
        },
      ];

      const prompt = getMealPlanPrompt(products, "2025-02-01");

      expect(prompt).toContain("Soon");
      expect(prompt).toContain("Medium");
      expect(prompt).toContain("Later");
      expect(prompt).toContain("expires 2025-02-02 [USE SOON - within 3 days]");
      expect(prompt).toContain("expires 2025-02-06 [medium priority - within 7 days]");
      expect(prompt).toMatch(/Later:.*expires 2025-02-15(?!\s*\[)/);
    });
  });
});
