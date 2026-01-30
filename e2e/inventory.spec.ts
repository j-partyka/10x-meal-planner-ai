import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { InventoryPage } from "./pages/InventoryPage";
import { getE2ECredentials } from "./fixtures/auth";

test.describe("Inventory — CRUD, search", () => {
  test.beforeEach(async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect();
  });

  test.skip("I3: add product and see it in list", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    const name = `E2E Product ${Date.now()}`;
    const expiration = "2026-12-31";
    await inventoryPage.addProduct({
      name,
      quantity: "2",
      unit: "pieces",
      expiration_date: expiration,
      category: "E2E",
    });

    await expect(inventoryPage.productFormModal).not.toBeVisible();
    await inventoryPage.waitForLoadingFinished();

    const row = page.getByTestId("product-row").filter({ hasText: name }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("2");
    await expect(row).toContainText("pieces");
    await expect(row).toContainText("E2E");
  });

  test.skip("I7: edit product quantity", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    const name = `E2E Edit ${Date.now()}`;
    await inventoryPage.addProduct({
      name,
      quantity: "1",
      expiration_date: "2026-06-15",
    });
    await inventoryPage.waitForLoadingFinished();

    const row = page.getByTestId("product-row").filter({ hasText: name }).first();
    await expect(row).toBeVisible();
    const productId = await row.getAttribute("data-product-id");
    expect(productId).toBeTruthy();

    await inventoryPage.editProduct(productId!, { quantity: "5" });
    await expect(inventoryPage.productFormModal).not.toBeVisible();
    await inventoryPage.waitForLoadingFinished();

    const updatedRow = inventoryPage.getProductRow(productId!);
    await expect(updatedRow).toContainText("5");
  });

  test.skip("I9: search filters list", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    const uniqueName = `E2ESearch${Date.now()}`;
    await inventoryPage.addProduct({
      name: uniqueName,
      quantity: "1",
      expiration_date: "2026-06-01",
    });
    await inventoryPage.waitForLoadingFinished();

    await inventoryPage.search(uniqueName);
    const row = page.getByTestId("product-row").filter({ hasText: uniqueName }).first();
    await expect(row).toBeVisible();

    await inventoryPage.search("nonexistentxyz123");
    await expect(inventoryPage.noSearchResults).toBeVisible();
    await inventoryPage.clearSearch();
    await expect(inventoryPage.noSearchResults).not.toBeVisible();
  });

  test.skip("I8: delete product with confirmation", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await inventoryPage.waitForLoadingFinished();

    const name = `E2E Delete ${Date.now()}`;
    await inventoryPage.addProduct({
      name,
      quantity: "1",
      expiration_date: "2026-06-01",
    });
    await inventoryPage.waitForLoadingFinished();

    const row = page.getByTestId("product-row").filter({ hasText: name }).first();
    const productId = await row.getAttribute("data-product-id");
    expect(productId).toBeTruthy();

    await inventoryPage.confirmDeleteProduct(productId!);
    await inventoryPage.waitForLoadingFinished();

    await expect(inventoryPage.getProductRow(productId!)).not.toBeVisible();
  });
});
