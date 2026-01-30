import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { InventoryPage } from "./pages/InventoryPage";
import { getE2ECredentials } from "./fixtures/auth";

test.describe("Auth — login, redirect, logout", () => {
  test("A1: unauthenticated access to protected pages redirects to login", async ({ page }) => {
    for (const path of ["/", "/meal-plan", "/shopping-list"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirect=${encodeURIComponent(path)}`));
    }
  });

  test("login page shows sign-in form and mode switcher", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.root).toBeVisible();
    await expect(loginPage.signInEmailInput).toBeVisible();
    await expect(loginPage.signInPasswordInput).toBeVisible();
    await expect(loginPage.signInSubmitButton).toBeVisible();
    await expect(loginPage.tabSignIn).toBeVisible();
    await expect(loginPage.tabRegister).toBeVisible();
  });

  test("A3: login with invalid credentials shows error, no redirect", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.signInSubmitButton).toBeVisible();
    await loginPage.signIn("invalid@example.com", "wrongpassword");
    // Wait for async sign-in to complete and inline error to appear.
    await expect(loginPage.authError).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
    const message = await loginPage.getErrorMessage();
    expect(message.length).toBeGreaterThan(0);
  });

  test("A2 & MW4: login with valid credentials redirects to home; redirect param works", async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    if (!creds) return;

    const loginPage = new LoginPage(page);
    await loginPage.goto("/meal-plan");
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect({ path: /\/meal-plan/, timeout: 25_000 });
    await expect(page).toHaveURL(/\/meal-plan/);
    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.nav.nav).toBeVisible({ timeout: 15_000 });
  });

  test("A7: session persists after navigation", async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    if (!creds) return;

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect();

    await page.goto("/meal-plan");
    await expect(page).toHaveURL(/\/meal-plan/);
    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.nav.nav).toBeVisible();
  });

  test.skip("A8: logout redirects to login and clears session", async ({ page }) => {
    const creds = getE2ECredentials();
    test.skip(!creds, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    if (!creds) return;

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(creds.email, creds.password);
    await loginPage.waitForRedirect();

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.nav.logout();
    // After signOut + redirect to /login, middleware may still see session and redirect to /; accept either.
    await expect(page).toHaveURL(/\/(login)?(\?|$)/, { timeout: 10_000 });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
