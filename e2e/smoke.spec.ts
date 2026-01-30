import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Smoke — auth and app load", () => {
  test("login page loads and shows sign-in form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("unauthenticated access to home redirects to login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
