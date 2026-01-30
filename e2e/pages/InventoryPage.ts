import { type Locator, type Page } from "@playwright/test";
import { AppNav } from "./AppNav";

export interface ProductFormFields {
  name: string;
  quantity: string;
  unit?: string;
  expiration_date: string;
  category?: string;
}

/**
 * Page Object for the Inventory page (/).
 * Covers list, search, add/edit product modal, delete dialog.
 */
export class InventoryPage {
  readonly page: Page;
  readonly nav: AppNav;

  readonly root: Locator;
  readonly header: Locator;
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly addProductButton: Locator;
  readonly loadingMessage: Locator;
  readonly productTable: Locator;
  readonly emptyState: Locator;
  readonly emptyStateAddButton: Locator;
  readonly noSearchResults: Locator;
  readonly clearSearchButton: Locator;

  // Product form modal
  readonly productFormModal: Locator;
  readonly productFormModalClose: Locator;
  readonly productFormName: Locator;
  readonly productFormQuantity: Locator;
  readonly productFormUnit: Locator;
  readonly productFormExpirationDate: Locator;
  readonly productFormCategory: Locator;
  readonly productFormCancel: Locator;
  readonly productFormSubmit: Locator;
  readonly productFormSaving: Locator;

  // Delete dialog
  readonly deleteProductDialog: Locator;
  readonly deleteProductDialogCancel: Locator;
  readonly deleteProductDialogConfirm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new AppNav(page);

    this.root = page.getByTestId("inventory-page");
    this.header = page.getByTestId("inventory-header");
    this.searchInput = page.getByTestId("inventory-search-input");
    this.searchClearButton = page.getByTestId("inventory-search-clear");
    this.addProductButton = page.getByTestId("inventory-add-product");
    this.loadingMessage = page.getByTestId("inventory-loading");
    this.productTable = page.getByTestId("inventory-product-table");
    this.emptyState = page.getByTestId("inventory-empty-state");
    this.emptyStateAddButton = page.getByTestId("inventory-empty-add-product");
    this.noSearchResults = page.getByTestId("inventory-no-search-results");
    this.clearSearchButton = page.getByTestId("inventory-clear-search");

    this.productFormModal = page.getByTestId("product-form-modal");
    this.productFormModalClose = page.getByTestId("product-form-modal-close");
    this.productFormName = page.getByTestId("product-form-name");
    this.productFormQuantity = page.getByTestId("product-form-quantity");
    this.productFormUnit = page.getByTestId("product-form-unit");
    this.productFormExpirationDate = page.getByTestId("product-form-expiration-date");
    this.productFormCategory = page.getByTestId("product-form-category");
    this.productFormCancel = page.getByTestId("product-form-cancel");
    this.productFormSubmit = page.getByTestId("product-form-submit");
    this.productFormSaving = page.getByTestId("product-form-saving");

    this.deleteProductDialog = page.getByTestId("delete-product-dialog");
    this.deleteProductDialogCancel = page.getByTestId("delete-product-dialog-cancel");
    this.deleteProductDialogConfirm = page.getByTestId("delete-product-dialog-confirm");
  }

  async goto() {
    await this.page.goto("/");
  }

  getProductRow(productId: string): Locator {
    return this.page.locator(`[data-test-id="product-row"][data-product-id="${productId}"]`).first();
  }

  getProductEditButton(productId: string): Locator {
    return this.getProductRow(productId).getByTestId("product-edit");
  }

  getProductDeleteButton(productId: string): Locator {
    return this.getProductRow(productId).getByTestId("product-delete");
  }

  async addProduct(fields: ProductFormFields) {
    await this.addProductButton.click();
    await this.productFormModal.waitFor({ state: "visible" });
    await this.productFormName.fill(fields.name);
    await this.productFormQuantity.fill(fields.quantity);
    if (fields.unit) await this.productFormUnit.selectOption(fields.unit);
    await this.productFormExpirationDate.fill(fields.expiration_date);
    if (fields.category != null) await this.productFormCategory.fill(fields.category);
    await this.productFormSubmit.click();
  }

  async editProduct(productId: string, fields: Partial<ProductFormFields>) {
    await this.getProductEditButton(productId).click();
    await this.productFormModal.waitFor({ state: "visible" });
    if (fields.name != null) await this.productFormName.fill(fields.name);
    if (fields.quantity != null) await this.productFormQuantity.fill(fields.quantity);
    if (fields.unit != null) await this.productFormUnit.selectOption(fields.unit);
    if (fields.expiration_date != null) await this.productFormExpirationDate.fill(fields.expiration_date);
    if (fields.category != null) await this.productFormCategory.fill(fields.category);
    await this.productFormSubmit.click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }

  async closeProductModal() {
    await this.productFormModalClose.click();
  }

  async confirmDeleteProduct(productId: string) {
    await this.getProductDeleteButton(productId).click();
    await this.deleteProductDialog.waitFor({ state: "visible" });
    await this.deleteProductDialogConfirm.click();
  }

  async cancelDeleteProduct() {
    await this.deleteProductDialogCancel.click();
  }

  async waitForLoadingFinished() {
    await this.loadingMessage.waitFor({ state: "hidden" }).catch(() => undefined);
  }
}
