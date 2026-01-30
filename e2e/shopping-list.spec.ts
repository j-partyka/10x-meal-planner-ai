import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { MealPlanPage } from "./pages/MealPlanPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { InventoryPage } from "./pages/InventoryPage";
import { getE2ECredentials } from "./fixtures/auth";

test.describe("Shopping list — no plan, list after generate", () => {
  test.beforeEach(async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect();
  });

  test.skip("S4: no plan state shows links to meal plan and inventory", async ({
    page,
  }) => {
    const shoppingListPage = new ShoppingListPage(page);
    await shoppingListPage.goto();

    await expect(shoppingListPage.noPlanState).toBeVisible();
    await expect(shoppingListPage.noPlanGoToMealPlan).toBeVisible();
    await expect(shoppingListPage.noPlanGoToInventory).toBeVisible();
  });

  test.skip("S4: after generating plan, shopping list shows grouped list", async ({
    page,
  }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    await inventoryPage.addProduct({
      name: `E2E Shop ${Date.now()}`,
      quantity: "1",
      expiration_date: "2026-12-31",
    });
    await inventoryPage.waitForLoadingFinished();

    const mealPlanPage = new MealPlanPage(page);
    await mealPlanPage.goto();
    await mealPlanPage.generate();
    await mealPlanPage.waitForTableVisible();

    const shoppingListPage = new ShoppingListPage(page);
    await shoppingListPage.goto();
    await shoppingListPage.waitForGroupedListVisible();
    await expect(shoppingListPage.groupedList).toBeVisible();
    await expect(shoppingListPage.categorySections.first()).toBeVisible();
  });
});
