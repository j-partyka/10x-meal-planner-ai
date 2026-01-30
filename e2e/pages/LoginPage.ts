import { type Locator, type Page } from "@playwright/test";

/**
 * Page Object for the login page (/login).
 * Covers sign-in and register forms; uses data-test-id locators.
 */
export class LoginPage {
  readonly page: Page;

  // Page / container
  readonly root: Locator;

  // Mode switcher
  readonly tabSignIn: Locator;
  readonly tabRegister: Locator;

  // Sign-in form
  readonly signInForm: Locator;
  readonly signInEmailInput: Locator;
  readonly signInPasswordInput: Locator;
  readonly signInSubmitButton: Locator;

  // Register form
  readonly registerForm: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerConfirmInput: Locator;
  readonly registerSubmitButton: Locator;

  // Shared
  readonly authError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("login-page");

    this.tabSignIn = page.getByTestId("auth-tab-signin");
    this.tabRegister = page.getByTestId("auth-tab-register");

    this.signInForm = page.getByTestId("signin-form");
    this.signInEmailInput = page.getByTestId("signin-email");
    this.signInPasswordInput = page.getByTestId("signin-password");
    this.signInSubmitButton = page.getByTestId("signin-submit");

    this.registerForm = page.getByTestId("register-form");
    this.registerEmailInput = page.getByTestId("register-email");
    this.registerPasswordInput = page.getByTestId("register-password");
    this.registerConfirmInput = page.getByTestId("register-confirm-password");
    this.registerSubmitButton = page.getByTestId("register-submit");

    this.authError = page.getByTestId("auth-error");
  }

  async goto(redirect?: string) {
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
    await this.page.goto(url);
  }

  async signIn(email: string, password: string) {
    await this.signInEmailInput.fill(email);
    await this.signInPasswordInput.fill(password);
    await this.signInSubmitButton.click();
  }

  /**
   * Wait for navigation away from /login after sign-in (use when expecting successful login).
   * Timeout 20s to allow Supabase auth + redirect; domcontentloaded to avoid waiting for full load.
   */
  async waitForRedirect(options?: { timeout?: number; path?: string | RegExp }) {
    const timeout = options?.timeout ?? 20_000;
    const waitUntil = "domcontentloaded" as const;
    if (options?.path !== undefined) {
      await this.page.waitForURL(options.path, { timeout, waitUntil });
    } else {
      await this.page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout, waitUntil });
    }
  }

  async switchToRegister() {
    await this.tabRegister.click();
  }

  async switchToSignIn() {
    await this.tabSignIn.click();
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.switchToRegister();
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmInput.fill(confirmPassword);
    await this.registerSubmitButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.authError.textContent()) ?? "";
  }
}
