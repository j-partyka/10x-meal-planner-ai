import { useCallback } from "react";
import type { ProductDto } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExpirationIndicator } from "./ExpirationIndicator";
import { cn } from "@/lib/utils";

export interface ProductTableProps {
  products: ProductDto[];
  onEdit: (product: ProductDto) => void;
  onDelete: (product: ProductDto) => void;
  "aria-label"?: string;
}

function formatExpirationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  "aria-label": ariaLabel = "Product list",
}: ProductTableProps) {
  const handleEdit = useCallback(
    (product: ProductDto) => () => onEdit(product),
    [onEdit]
  );
  const handleDelete = useCallback(
    (product: ProductDto) => () => onDelete(product),
    [onDelete]
  );

  return (
    <>
      {/* Table: visible from md up */}
      <div
        className="hidden md:block"
        role="region"
        aria-label={ariaLabel}
        data-test-id="inventory-product-table"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} data-test-id="product-row" data-product-id={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <ExpirationIndicator
                      expirationDate={product.expiration_date}
                      data-test-id="product-expiration-indicator"
                    />
                    <span className="text-muted-foreground">
                      {formatExpirationDate(product.expiration_date)}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      data-test-id="product-edit"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete(product)}
                      aria-label={`Delete ${product.name}`}
                      data-test-id="product-delete"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Card list: visible on small screens */}
      <ul
        className="flex flex-col gap-3 md:hidden"
        aria-label={ariaLabel}
        role="list"
        data-test-id="inventory-product-table"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className={cn(
              "rounded-lg border border-border bg-card p-4 shadow-sm",
              "flex flex-col gap-2"
            )}
            data-test-id="product-row"
            data-product-id={product.id}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-foreground">{product.name}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ExpirationIndicator expirationDate={product.expiration_date} />
                {formatExpirationDate(product.expiration_date)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                {product.quantity} {product.unit}
              </span>
              {product.category ? (
                <span>{product.category}</span>
              ) : null}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit(product)}
                aria-label={`Edit ${product.name}`}
                className="flex-1"
                data-test-id="product-edit"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete(product)}
                aria-label={`Delete ${product.name}`}
                className="flex-1"
                data-test-id="product-delete"
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
