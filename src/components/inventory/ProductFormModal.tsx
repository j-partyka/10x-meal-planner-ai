import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateProductCommand, ProductDto, UpdateProductCommand } from "@/types";
import { authFetch } from "@/lib/auth-fetch";
import { ProductForm } from "./ProductForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_PRODUCTS = "/api/products";

export interface ProductFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialProduct?: ProductDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApiErrorBody {
  error?: string;
  details?: { field: string; message: string }[];
}

export function ProductFormModal({ open, mode, initialProduct, onClose, onSuccess }: ProductFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = useState<{ details?: { field: string; message: string }[] } | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setSubmitError(undefined);
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    setSubmitError(undefined);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  const handleCancel = useCallback(() => {
    dialogRef.current?.close();
    handleClose();
  }, [handleClose]);

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

  const handleSubmit = useCallback(
    async (data: CreateProductCommand | UpdateProductCommand) => {
      setSubmitting(true);
      setSubmitError(undefined);

      if (mode === "add") {
        const res = await authFetch(API_PRODUCTS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 201) {
          setSubmitting(false);
          onSuccess();
          handleClose();
          return;
        }

        if (res.status === 400) {
          const body = (await res.json()) as ApiErrorBody;
          setSubmitError({ details: body.details });
          setSubmitting(false);
          return;
        }

        if (res.status === 401) {
          setSubmitting(false);
          return;
        }

        setSubmitError({ details: [{ field: "_form", message: "Something went wrong. Please try again." }] });
        setSubmitting(false);
        return;
      }

      const id = initialProduct?.id;
      if (!id) {
        setSubmitError({ details: [{ field: "_form", message: "Product not found." }] });
        setSubmitting(false);
        return;
      }

      const res = await authFetch(`${API_PRODUCTS}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitting(false);
        onSuccess();
        handleClose();
        return;
      }

      if (res.status === 400) {
        const body = (await res.json()) as ApiErrorBody;
        setSubmitError({ details: body.details });
        setSubmitting(false);
        return;
      }

      if (res.status === 404) {
        handleClose();
        setSubmitting(false);
        return;
      }

      if (res.status === 401) {
        setSubmitting(false);
        return;
      }

      setSubmitError({ details: [{ field: "_form", message: "Something went wrong. Please try again." }] });
      setSubmitting(false);
    },
    [mode, initialProduct?.id, onSuccess, handleClose]
  );

  const title = mode === "add" ? "Add product" : "Edit product";

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-background p-6 shadow-lg",
        "backdrop:bg-black/50",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
      )}
      aria-modal="true"
      aria-labelledby="product-form-modal-title"
      data-test-id="product-form-modal"
    >
      <h2 id="product-form-modal-title" className="sr-only">
        {title}
      </h2>
      <div className="flex items-center justify-between gap-4 pb-4">
        <span className="text-lg font-semibold text-foreground">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleCancel}
          aria-label="Close"
          data-test-id="product-form-modal-close"
        >
          ×
        </Button>
      </div>
      <ProductForm
        mode={mode}
        initialValues={initialProduct ?? undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitError={submitError}
      />
      {submitting && (
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite" data-test-id="product-form-saving">
          Saving…
        </p>
      )}
    </dialog>
  );
}
