import { type Locator, type Page } from "@playwright/test";
import { AppNav } from "./AppNav";

/**
 * Page Object for the Meal Plan page (/meal-plan).
 * Covers prompt, generate/regenerate, loading, error, empty states, table, link to shopping list.
 */
export class MealPlanPage {
  readonly page: Page;
  readonly nav: AppNav;

  readonly root: Locator;
  readonly header: Locator;
  readonly promptSection: Locator;
  readonly promptTextarea: Locator;
  readonly generateButton: Locator;
  readonly regenerateButton: Locator;
  readonly linkShoppingList: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;
  readonly emptyState: Locator;
  readonly emptyStateGoToInventory: Locator;
  readonly emptyStateWithInventory: Locator;
  readonly mealPlanTable: Locator;
  readonly mealCellContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new AppNav(page);

    this.root = page.getByTestId("meal-plan-page");
    this.header = page.getByTestId("meal-plan-header");
    this.promptSection = page.getByTestId("meal-plan-prompt-section");
    this.promptTextarea = page.getByTestId("meal-plan-prompt");
    this.generateButton = page.getByTestId("meal-plan-generate");
    this.regenerateButton = page.getByTestId("meal-plan-regenerate");
    this.linkShoppingList = page.getByTestId("meal-plan-link-shopping-list");
    this.loadingState = page.getByTestId("meal-plan-loading");
    this.errorState = page.getByTestId("meal-plan-error");
    this.retryButton = page.getByTestId("meal-plan-retry");
    this.emptyState = page.getByTestId("meal-plan-empty");
    this.emptyStateGoToInventory = page.getByTestId("meal-plan-empty-go-to-inventory");
    this.emptyStateWithInventory = page.getByTestId("meal-plan-empty-with-inventory");
    this.mealPlanTable = page.getByTestId("meal-plan-table");
    this.mealCellContent = page.getByTestId("meal-cell-content");
  }

  async goto() {
    await this.page.goto("/meal-plan");
  }

  async generate() {
    await this.generateButton.click();
  }

  async regenerate() {
    await this.regenerateButton.click();
  }

  async goToShoppingList() {
    await this.linkShoppingList.click();
  }

  async retry() {
    await this.retryButton.click();
  }

  async waitForTableVisible() {
    await this.mealPlanTable.waitFor({ state: "visible" });
  }

  async waitForLoadingFinished() {
    await this.loadingState.waitFor({ state: "hidden" }).catch(() => undefined);
  }
}
