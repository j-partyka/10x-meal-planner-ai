import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductDto } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DeleteProductDialogProps {
  open: boolean;
  product: ProductDto | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteProductDialog({
  open,
  product,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    setDeleting(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [handleClose]);

  const handleConfirm = useCallback(async () => {
    if (!product?.id) {
      handleClose();
      return;
    }
    setDeleting(true);
    try {
      await onConfirm(product.id);
      handleClose();
    } catch {
      setDeleting(false);
    }
  }, [product?.id, onConfirm, handleClose]);

  const productName = product?.name ?? "this product";

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-border bg-background p-6 shadow-lg",
        "backdrop:bg-black/50",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
      )}
      aria-modal="true"
      aria-labelledby="delete-product-dialog-title"
      aria-describedby="delete-product-dialog-description"
      data-test-id="delete-product-dialog"
    >
      <h2 id="delete-product-dialog-title" className="text-lg font-semibold text-foreground">
        Delete product?
      </h2>
      <p id="delete-product-dialog-description" className="mt-2 text-muted-foreground">
        Are you sure you want to delete {productName}? This cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={deleting}
          data-test-id="delete-product-dialog-cancel"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={deleting}
          aria-busy={deleting}
          data-test-id="delete-product-dialog-confirm"
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </dialog>
  );
}
