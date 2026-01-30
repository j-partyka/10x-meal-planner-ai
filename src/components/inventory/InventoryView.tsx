import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProductDto } from "@/types";
import type { PaginatedResponse } from "@/types";
import { authFetch } from "@/lib/auth-fetch";
import { PageHeader } from "./PageHeader";
import { SearchInput } from "./SearchInput";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { NoSearchResultsState } from "./NoSearchResultsState";
import { ProductTable } from "./ProductTable";
import { ProductFormModal } from "./ProductFormModal";
import { DeleteProductDialog } from "./DeleteProductDialog";

const API_PRODUCTS = "/api/products";
/** API allows max limit 100; use 100 so refetch after add/edit/delete returns data. */
const DEFAULT_LIMIT = 100;

function buildListProductsUrl(): string {
  const params = new URLSearchParams({
    sort: "expiration_date",
    order: "asc",
    limit: String(DEFAULT_LIMIT),
  });
  return `${API_PRODUCTS}?${params.toString()}`;
}

function filterProductsBySearch(products: ProductDto[], searchQuery: string): ProductDto[] {
  if (!searchQuery.trim()) return products;
  const q = searchQuery.trim().toLowerCase();
  return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q));
}

export function InventoryView() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(buildListProductsUrl());
      if (res.ok) {
        const json = (await res.json()) as PaginatedResponse<ProductDto>;
        setProducts(json.data ?? []);
      }
    } catch {
      // authFetch redirects on 401; other errors can be surfaced later
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = filterProductsBySearch(products, searchQuery);
  const hasSearch = searchQuery.trim().length > 0;
  const showEmptyState = !loading && products.length === 0;
  const showNoSearchResults = !loading && hasSearch && filteredProducts.length === 0;
  const showList = !loading && filteredProducts.length > 0;

  const handleModalSuccess = useCallback(() => {
    if (editingProduct) {
      toast.success("Product updated");
    } else {
      toast.success("Product added");
    }
    setModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
    addButtonRef.current?.focus();
  }, [fetchProducts, editingProduct]);

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      const res = await authFetch(`${API_PRODUCTS}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) return;
      toast.success("Product deleted");
      setDeleteTarget(null);
      fetchProducts();
      requestAnimationFrame(() => {
        addButtonRef.current?.focus();
      });
    },
    [fetchProducts]
  );

  return (
    <main
      className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8"
      role="main"
      aria-label="Inventory"
      data-test-id="inventory-page"
    >
      <PageHeader title="Inventory" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products…"
          debounceMs={300}
          loading={loading}
          data-test-id="inventory-search"
        />
        <Button
          ref={addButtonRef}
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          data-test-id="inventory-add-product"
        >
          Add product
        </Button>
      </div>

      {loading && (
        <p className="text-muted-foreground" aria-live="polite" data-test-id="inventory-loading">
          Loading…
        </p>
      )}

      {showEmptyState && (
        <EmptyState
          onAddClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
        />
      )}

      {showNoSearchResults && <NoSearchResultsState onClearSearch={() => setSearchQuery("")} />}

      {showList && (
        <ProductTable
          products={filteredProducts}
          onEdit={(product) => {
            setEditingProduct(product);
            setModalOpen(true);
          }}
          onDelete={(product) => setDeleteTarget(product)}
          aria-label="Product list"
        />
      )}

      <ProductFormModal
        open={modalOpen}
        mode={editingProduct ? "edit" : "add"}
        initialProduct={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleModalSuccess}
      />

      <DeleteProductDialog
        open={deleteTarget != null}
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
}
