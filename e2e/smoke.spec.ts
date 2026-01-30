import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Smoke — auth and app load", () => {
  test("login page loads and shows sign-in form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.signInEmailInput).toBeVisible();
    await expect(loginPage.signInPasswordInput).toBeVisible();
    await expect(loginPage.signInSubmitButton).toBeVisible();
  });

  test("unauthenticated access to home redirects to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
