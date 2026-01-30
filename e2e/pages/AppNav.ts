import { type Locator, type Page } from "@playwright/test";

/**
 * Page Object for the main navigation (AppNav).
 * Present on all authenticated pages (/, /meal-plan, /shopping-list).
 * Use locators for resilient element selection.
 */
export class AppNav {
  readonly page: Page;

  readonly nav: Locator;
  readonly linkInventory: Locator;
  readonly linkMealPlan: Locator;
  readonly linkShoppingList: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.getByTestId("nav");
    this.linkInventory = page.getByTestId("nav-link-inventory");
    this.linkMealPlan = page.getByTestId("nav-link-meal-plan");
    this.linkShoppingList = page.getByTestId("nav-link-shopping-list");
    this.logoutButton = page.getByTestId("nav-logout");
  }

  async gotoInventory() {
    await this.linkInventory.click();
  }

  async gotoMealPlan() {
    await this.linkMealPlan.click();
  }

  async gotoShoppingList() {
    await this.linkShoppingList.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
