import { type Locator, type Page } from "@playwright/test";
import { AppNav } from "./AppNav";

/**
 * Page Object for the Shopping List page (/shopping-list).
 * Covers no-plan state, loading, error, refresh, empty list, grouped list by category.
 */
export class ShoppingListPage {
  readonly page: Page;
  readonly nav: AppNav;

  readonly root: Locator;
  readonly header: Locator;
  readonly noPlanState: Locator;
  readonly noPlanGoToMealPlan: Locator;
  readonly noPlanGoToInventory: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly refreshButton: Locator;
  readonly emptyListState: Locator;
  readonly groupedList: Locator;
  readonly categorySections: Locator;
  readonly listItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new AppNav(page);

    this.root = page.getByTestId("shopping-list-page");
    this.header = page.getByTestId("shopping-list-header");
    this.noPlanState = page.getByTestId("shopping-list-no-plan");
    this.noPlanGoToMealPlan = page.getByTestId("shopping-list-no-plan-go-to-meal-plan");
    this.noPlanGoToInventory = page.getByTestId("shopping-list-no-plan-go-to-inventory");
    this.loadingMessage = page.getByTestId("shopping-list-loading");
    this.errorMessage = page.getByTestId("shopping-list-error");
    this.refreshButton = page.getByTestId("shopping-list-refresh");
    this.emptyListState = page.getByTestId("shopping-list-empty");
    this.groupedList = page.getByTestId("shopping-list-grouped");
    this.categorySections = page.getByTestId("shopping-list-category");
    this.listItems = page.getByTestId("shopping-list-item");
  }

  async goto() {
    await this.page.goto("/shopping-list");
  }

  async refresh() {
    await this.refreshButton.click();
  }

  async goToMealPlan() {
    await this.noPlanGoToMealPlan.click();
  }

  async goToInventory() {
    await this.noPlanGoToInventory.click();
  }

  async waitForGroupedListVisible() {
    await this.groupedList.waitFor({ state: "visible" });
  }

  async waitForLoadingFinished() {
    await this.loadingMessage.waitFor({ state: "hidden" }).catch(() => {});
  }
}
