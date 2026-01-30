import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { MealPlanPage } from "./pages/MealPlanPage";
import { InventoryPage } from "./pages/InventoryPage";
import { getE2ECredentials } from "./fixtures/auth";

test.describe("Meal plan — generate, table, regenerate", () => {
  test.beforeEach(async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect();
  });

  test.skip("M7: generate button disabled when inventory empty", async ({ page }) => {
    const mealPlanPage = new MealPlanPage(page);
    await mealPlanPage.goto();

    await expect(mealPlanPage.generateButton).toBeDisabled();
    await expect(mealPlanPage.emptyState).toBeVisible();
  });

  test.skip("M8 & M9: generate plan, see table, regenerate", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    const name = `E2E MealPlan ${Date.now()}`;
    await inventoryPage.addProduct({
      name,
      quantity: "1",
      expiration_date: "2026-12-31",
      category: "E2E",
    });
    await inventoryPage.waitForLoadingFinished();

    const mealPlanPage = new MealPlanPage(page);
    await mealPlanPage.goto();
    await expect(mealPlanPage.emptyStateWithInventory).toBeVisible();
    await expect(mealPlanPage.generateButton).toBeEnabled();

    await mealPlanPage.generate();
    await mealPlanPage.waitForTableVisible();
    await expect(mealPlanPage.mealPlanTable).toBeVisible();
    await expect(mealPlanPage.mealCellContent.first()).toBeVisible();

    await mealPlanPage.regenerate();
    await mealPlanPage.waitForLoadingFinished();
    await expect(mealPlanPage.mealPlanTable).toBeVisible();
  });

  test.skip("link to shopping list navigates to shopping list page", async ({
    page,
  }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    await inventoryPage.addProduct({
      name: `E2E Link ${Date.now()}`,
      quantity: "1",
      expiration_date: "2026-12-31",
    });
    await inventoryPage.waitForLoadingFinished();

    const mealPlanPage = new MealPlanPage(page);
    await mealPlanPage.goto();
    await mealPlanPage.generate();
    await mealPlanPage.waitForTableVisible();

    await mealPlanPage.goToShoppingList();
    await expect(page).toHaveURL(/\/shopping-list/);
  });
});
