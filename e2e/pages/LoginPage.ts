import { type Locator, type Page } from "@playwright/test";

/**
 * Page Object for the login page (/login).
 * Use locators for resilient element selection.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole("button", { name: /sign in|log in/i });
    this.registerLink = page.getByRole("link", { name: /register|create account/i });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
