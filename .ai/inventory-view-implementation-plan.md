# View Implementation Plan: Inventory (Home)

## 1. Overview

The Inventory view is the home page of the application. It lets users view, search, add, edit, and delete kitchen products so inventory stays current for meal planning. Products are displayed in a list or table with expiration indicators (urgent ≤3 days, warning ≤7 days, normal, expired). The view includes debounced search, an add-product action, add/edit product modal (or drawer on mobile), and a delete-confirmation dialog. Data is loaded via GET `/api/products` with default sort by expiration date ascending; no pagination UI for MVP (limit=200). Client-side validation mirrors the API; 401 triggers redirect to login.

## 2. View Routing

- **Path:** `/`
- **Astro page:** `src/pages/index.astro`
- **Protected:** Yes. Unauthenticated users are redirected to `/login` (optionally with `?redirect=/`).
- **Layout:** Use root layout with navigation bar (Inventory, Meal plan, Shopping list, Logout).

## 3. Component Structure

```
InventoryPage (Astro page)
└── InventoryView (React, client:load)
    ├── PageHeader (title)
    ├── SearchInput (debounced, clear button)
    ├── AddProductButton
    ├── ProductList | ProductTable (rows: name, quantity, unit, expiration date, category, Edit, Delete; ExpirationIndicator per row)
    ├── EmptyState (no products)
    ├── NoSearchResultsState (no products match search + "Clear search" CTA)
    ├── ProductFormModal (Dialog/Sheet: ProductForm for Add/Edit)
    └── DeleteProductDialog (confirmation)
```

Optional: One container component (e.g. InventoryView) that composes header, search, list, and modals; or keep list and modals as siblings.

## 4. Component Details

### InventoryView (or InventoryPage container)

- **Description:** Top-level container that fetches products, holds search query and list state, and coordinates add/edit/delete flows. Renders header, search, add button, list/empty/no-results states, product modal, and delete dialog.
- **Main elements:** `main`, PageHeader, SearchInput, AddProductButton, ProductList or ProductTable, conditional EmptyState / NoSearchResultsState, ProductFormModal, DeleteProductDialog.
- **Handled events:** Load: fetch products (GET `/api/products` with sort=expiration_date, order=asc, limit=200). Search change (debounced 300 ms) filters client-side or refetch with search param. Add click: open modal in add mode. Edit click: open modal in edit mode with product. Delete click: open delete confirmation. After add: close modal, toast, refetch or append, focus "Add product" or first row. After edit: close modal, toast, refetch or update list, focus that row’s Edit. After delete: close dialog, toast, refetch or remove from list, move focus off deleted element.
- **Validation:** Not applicable at container level; form and API handle validation.
- **Types:** Uses `ProductDto`, `PaginatedResponse<ProductDto>`, `CreateProductCommand`, `UpdateProductCommand`. View state: `products: ProductDto[]`, `searchQuery: string`, `loading: boolean`, `modalOpen: boolean`, `editingProduct: ProductDto | null`, `deleteTarget: ProductDto | null`.
- **Props:** None (page-level container).

### PageHeader

- **Description:** Page title (e.g. "Inventory" or "Kitchen").
- **Main elements:** `h1` or heading component.
- **Handled events:** None.
- **Types:** Optional `title?: string`.
- **Props:** `title?: string`.

### SearchInput

- **Description:** Search field with debounced (e.g. 300 ms) filtering and a clear "X" button. Optional loading indicator near field. Matches API: case-insensitive search on name and category.
- **Main elements:** Input (type search or text), clear button (visible when query non-empty), optional loading spinner.
- **Handled events:** Change: update local value immediately; after debounce update parent/search state. Clear click: clear query. Parent filters list (client-side) or passes search to API (GET `/api/products?search=...`). UI plan: default sort=expiration_date, order=asc, limit=200; search can be client-side filter for MVP.
- **Validation:** None (free text).
- **Types:** `value: string`, `onChange: (value: string) => void`, `onClear?: () => void`, `loading?: boolean`.
- **Props:** `value: string`, `onChange: (value: string) => void`, `placeholder?: string`, `debounceMs?: number` (default 300).

### AddProductButton

- **Description:** Button that opens the product form modal in add mode.
- **Main elements:** Button "Add product".
- **Handled events:** Click: open modal, mode = add.
- **Types:** None.
- **Props:** `onClick: () => void`.

### ProductList / ProductTable

- **Description:** Displays products in list or table format. Each row: name, quantity, unit, expiration date, category (optional), Edit button, Delete button, and ExpirationIndicator. Responsive: table or card list on small screens.
- **Main elements:** Table (TableHeader, TableBody, TableRow, TableCell) or list of cards; each row has ExpirationIndicator (icon or label, discernible without color alone).
- **Handled events:** Edit click: pass product to parent, open edit modal. Delete click: pass product to parent, open delete dialog.
- **Validation:** None.
- **Types:** `products: ProductDto[]`, `onEdit: (product: ProductDto) => void`, `onDelete: (product: ProductDto) => void`.
- **Props:** `products: ProductDto[]`, `onEdit`, `onDelete`. Optional `aria-label` for table.

### ExpirationIndicator

- **Description:** Visual and non-color cue for expiration: red/urgent (≤3 days), amber/warning (≤7 days), normal (beyond 7 days), expired (e.g. gray or strikethrough). Use icon or label so it’s discernible without color alone.
- **Main elements:** Span or div with class/icon and optional text (e.g. "Expires soon", "Expired").
- **Handled events:** None.
- **Types:** Input: `expirationDate: string` (YYYY-MM-DD). Compute status from current date.
- **Props:** `expirationDate: string`.

### EmptyState

- **Description:** Shown when there are no products. Message: "No products in inventory. Add your first product to get started." with "Add product" CTA.
- **Main elements:** Paragraph, Button "Add product".
- **Handled events:** CTA click: open add modal (same as AddProductButton).
- **Types:** None.
- **Props:** `onAddClick: () => void`.

### NoSearchResultsState

- **Description:** Shown when search is non-empty and filtered list is empty. Message: "No products match your search." with "Clear search" / "Show all" CTA.
- **Main elements:** Paragraph, Button "Clear search" or "Show all".
- **Handled events:** CTA click: clear search.
- **Types:** None.
- **Props:** `onClearSearch: () => void`.

### ProductFormModal (Dialog/Sheet)

- **Description:** Modal (desktop) or Sheet (mobile) that contains ProductForm. Focus trap and Escape to close. Same form for add and edit; title can be "Add product" or "Edit product".
- **Main elements:** Dialog (Shadcn) or Sheet; ProductForm as child; focus trap; close on Escape.
- **Handled events:** Open/close; submit from form: create or update via API, then close and notify parent. Cancel: close without submit.
- **Validation:** Delegated to ProductForm; block submit until valid.
- **Types:** `open: boolean`, `mode: 'add' | 'edit'`, `initialProduct?: ProductDto | null`, `onClose: () => void`, `onSuccess: () => void`.
- **Props:** `open`, `mode`, `initialProduct`, `onClose`, `onSuccess`.

### ProductForm

- **Description:** Form fields: name (required), quantity (required, positive), unit (required, dropdown: kg, g, ml, L, pieces), expiration date (required), category (optional). Inline validation errors; submit and cancel buttons.
- **Main elements:** Form, Input (name), Input number (quantity), Select (unit), Input date (expiration_date), Input (category optional), Button submit, Button cancel. Labels for all inputs.
- **Handled events:** Submit: validate, then POST (add) or PATCH (edit); on success callback. Cancel: close/cancel callback. Blur/change: validate field and show inline error.
- **Validation (mirror API):** name: required, non-empty, length ≤ 200. quantity: required, > 0, up to 3 decimal places. unit: required, one of kg, g, ml, L, pieces. expiration_date: required, YYYY-MM-DD, valid date. category: optional, length ≤ 100. Block submit until valid; show field-level errors from API `details` when present (400/422).
- **Types:** Create: `CreateProductCommand`. Edit: `UpdateProductCommand` (partial). Use `ProductDto` for initial values in edit. Props: `mode: 'add' | 'edit'`, `initialValues?: Partial<ProductDto>`, `onSubmit: (data) => void`, `onCancel: () => void`, `submitError?: { details?: { field: string; message: string }[] }`.
- **Props:** As above.

### DeleteProductDialog

- **Description:** Confirmation dialog. Title: "Delete product?" Body: "Are you sure you want to delete [name]? This cannot be undone." Cancel (primary), Delete (destructive, not default). On delete: call DELETE `/api/products/:id`, then close and notify parent; never leave focus on removed element.
- **Main elements:** AlertDialog (Shadcn); title, description with product name, Cancel button, Delete button (variant destructive).
- **Handled events:** Cancel: close. Delete: call API, on success close and remove product from list; move focus to next focusable (e.g. next row or header).
- **Validation:** None.
- **Types:** `open: boolean`, `product: ProductDto | null`, `onClose: () => void`, `onConfirm: (id: string) => Promise<void>`.
- **Props:** `open`, `product`, `onClose`, `onConfirm`.

## 5. Types

- **From `src/types.ts`:** `ProductDto` (Product), `CreateProductCommand`, `UpdateProductCommand`, `ListProductsQuery`, `ProductSortField`, `SortOrder`, `PaginationMeta`, `PaginatedResponse<ProductDto>`, `ProductUnit`.
- **API error payload:** `{ error: string; details?: { field: string; message: string }[] }` for 400 validation.
- **ViewModel (optional):** `ProductFormState` for controlled form: `{ name, quantity, unit, expiration_date, category }` with optional `errors: Record<string, string>`.
- **Expiration status:** Derived in component: `'expired' | 'urgent' | 'warning' | 'normal'` from `expirationDate` and current date (≤0 days expired, ≤3 urgent, ≤7 warning, else normal).

## 6. State Management

- **State in InventoryView:** `products: ProductDto[]`, `searchQuery: string` (debounced value used for filtering or API), `loading: boolean`, `modalOpen: boolean`, `editingProduct: ProductDto | null`, `deleteTarget: ProductDto | null`. Optional: `listLoading` for refetch.
- **Data fetching:** On mount and after add/edit/delete: GET `/api/products` with `sort=expiration_date`, `order=asc`, `limit=200`, optional `search` if server-side search used. For MVP, UI plan allows client-side filtering: fetch once, filter by searchQuery client-side.
- **Custom hook (optional):** `useProducts(query: ListProductsQuery)` that returns `{ data, meta, loading, error, refetch }` and handles 401 (redirect to login). If 401, redirect; if 400, surface details to form; if 500, show generic error.
- **Toast:** Use Sonner or Shadcn toast for "Product added", "Product updated", "Product deleted".

## 7. API Integration

- **GET /api/products:** Query: `sort=expiration_date`, `order=asc`, `limit=200`, optional `search`. Response: `PaginatedResponse<ProductDto>` (`{ data, meta }`). 401 → redirect to login; 500 → show generic error.
- **POST /api/products:** Body: `CreateProductCommand`. Response: 201, body = `ProductDto`. 400 → show `details` on form; 401 → redirect.
- **PATCH /api/products/:id:** Body: `UpdateProductCommand` (partial). Response: 200, body = `ProductDto`. 400 → show details; 401 → redirect; 404 → "Not found" and close modal.
- **DELETE /api/products/:id:** No body. Response: 204. 401 → redirect; 404 → "Not found" and close dialog.
- Use shared fetch wrapper that attaches auth (e.g. Supabase session / cookie) and handles 401 globally if desired.

## 8. User Interactions

- **Load page:** Fetch products; show list or empty state.
- **Type in search:** Debounce 300 ms; filter list (or refetch); show no-results state when applicable; clear "X" clears search.
- **Click "Add product":** Open modal in add mode; on success close modal, toast, refetch, focus "Add product" or first row.
- **Click "Edit" on row:** Open modal in edit mode with product; on success close modal, toast, refetch, focus that row’s Edit button.
- **Click "Delete" on row:** Open delete dialog; Cancel closes; Delete calls API, on success close dialog, toast, refetch, move focus off deleted row.
- **Submit form invalid:** Show inline errors; do not submit.
- **Submit form valid:** POST or PATCH; on 400/422 show API `details` on form; on success handle as above.
- **401 from any API:** Redirect to login with optional "Session expired or invalid. Please sign in again."

## 9. Conditions and Validation

- **Products load:** If 401, redirect to login. If empty list, show EmptyState; if search non-empty and no matches, show NoSearchResultsState.
- **Form validation (client):** name required, ≤200; quantity > 0, numeric; unit enum; expiration_date YYYY-MM-DD; category ≤100. Block submit until valid.
- **Form validation (API):** 400 response may include `details: [{ field, message }]`; map to field-level errors in ProductForm.
- **Expiration indicator:** Compute from current date: expired (date < today), urgent (≤3 days), warning (≤7 days), normal (else). Use for styling and optional label/icon.

## 10. Error Handling

- **401:** Redirect to `/login`; optionally set message "Session expired or invalid. Please sign in again."
- **400/422 (create/update):** Display API `details` as inline errors in ProductForm; do not expose raw error string to user.
- **404 (edit/delete):** Product not found or not owned; close modal/dialog and optionally toast "Product not found."
- **500:** Generic message (e.g. "Something went wrong. Please try again."); log for debugging.
- **Toast:** Short-lived success messages for add, update, delete.

## 11. Implementation Steps

1. Create `src/pages/index.astro`: use root layout with nav; mount InventoryView (React) with `client:load`.
2. Implement InventoryView: state (products, searchQuery, loading, modalOpen, editingProduct, deleteTarget); fetch GET `/api/products` on mount and after mutations (with auth); handle 401 redirect.
3. Implement SearchInput with debounce (300 ms) and clear button; wire to searchQuery; filter products client-side by name/category (case-insensitive) or pass search to API.
4. Implement ProductList/ProductTable: map products to rows with ExpirationIndicator, Edit, Delete; call onEdit/onDelete.
5. Implement ExpirationIndicator: accept expirationDate, compute status, render icon/label (color + non-color cue).
6. Implement EmptyState and NoSearchResultsState; show when appropriate.
7. Add ProductForm: fields and validation matching API; accept mode, initialValues, onSubmit, onCancel, submitError (API details).
8. Add ProductFormModal (Dialog/Sheet): wrap ProductForm; focus trap; on submit call POST or PATCH, then onSuccess/onClose; pass API details to form on 400.
9. Add DeleteProductDialog: show product name in body; on confirm call DELETE, then onSuccess and focus management.
10. Wire AddProductButton and EmptyState CTA to open add modal; wire Edit to open edit modal; wire Delete to open delete dialog.
11. Integrate toast (Sonner or Shadcn) for success messages; ensure focus management after add (focus "Add product" or first row), after edit (focus Edit button), after delete (focus next element, not deleted row).
12. Test: load, search, add, edit, delete; validation errors; 401 redirect; empty and no-search-results states.
