import { useCallback, useEffect, useId, useState } from "react";
import type { CreateProductCommand, ProductDto, ProductUnit, UpdateProductCommand } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRODUCT_UNITS: ProductUnit[] = ["kg", "g", "ml", "L", "pieces"];

const NAME_MAX = 200;
const CATEGORY_MAX = 100;
const QUANTITY_MIN = 0.001;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ProductFormValues {
  name: string;
  quantity: string;
  unit: ProductUnit;
  expiration_date: string;
  category: string;
}

export interface ProductFormSubmitError {
  details?: { field: string; message: string }[];
}

export interface ProductFormProps {
  mode: "add" | "edit";
  initialValues?: Partial<ProductDto> | null;
  onSubmit: (data: CreateProductCommand | UpdateProductCommand) => void;
  onCancel: () => void;
  submitError?: ProductFormSubmitError;
}

function toFormValues(product: Partial<ProductDto> | null | undefined): ProductFormValues {
  return {
    name: product?.name ?? "",
    quantity: product?.quantity != null ? String(product.quantity) : "",
    unit: (product?.unit as ProductUnit) ?? "pieces",
    expiration_date: product?.expiration_date ?? "",
    category: product?.category ?? "",
  };
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  if (name.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
  return null;
}

function validateQuantity(quantity: string): string | null {
  const n = Number(quantity);
  if (quantity.trim() === "") return "Quantity is required.";
  if (Number.isNaN(n)) return "Quantity must be a number.";
  if (n <= 0) return "Quantity must be greater than 0.";
  const decimals = (quantity.split(".")[1] ?? "").length;
  if (decimals > 3) return "Quantity may have at most 3 decimal places.";
  return null;
}

function validateUnit(unit: string): string | null {
  if (!PRODUCT_UNITS.includes(unit as ProductUnit)) return "Please select a unit.";
  return null;
}

function validateExpirationDate(date: string): string | null {
  if (!date.trim()) return "Expiration date is required.";
  if (!DATE_REGEX.test(date)) return "Date must be YYYY-MM-DD.";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "Invalid date.";
  return null;
}

function validateCategory(category: string): string | null {
  if (category.length > CATEGORY_MAX) return `Category must be at most ${CATEGORY_MAX} characters.`;
  return null;
}

function validateForm(values: ProductFormValues): Record<keyof ProductFormValues, string | null> {
  return {
    name: validateName(values.name),
    quantity: validateQuantity(values.quantity),
    unit: validateUnit(values.unit),
    expiration_date: validateExpirationDate(values.expiration_date),
    category: validateCategory(values.category),
  };
}

function hasErrors(errors: Record<string, string | null>): boolean {
  return Object.values(errors).some((e) => e != null);
}

export function ProductForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitError,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() =>
    toFormValues(initialValues)
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setValues(toFormValues(initialValues));
    setClientErrors({});
  }, [mode, initialValues?.id, initialValues?.name]);

  const apiErrors = useCallback(() => {
    const map: Record<string, string> = {};
    for (const { field, message } of submitError?.details ?? []) {
      map[field] = message;
    }
    return map;
  }, [submitError?.details]);

  const errors = { ...clientErrors, ...apiErrors() };
  const nameId = useId();
  const quantityId = useId();
  const unitId = useId();
  const expirationId = useId();
  const categoryId = useId();

  const handleChange = useCallback(
    (field: keyof ProductFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const v = e.target.value;
        setValues((prev) => ({ ...prev, [field]: v }));
        setClientErrors((prev) => ({ ...prev, [field]: null }));
      },
    []
  );

  const handleBlurStable = useCallback((field: keyof ProductFormValues) => () => {
    setValues((current) => {
      const errs = validateForm(current);
      setClientErrors((prev) => ({ ...prev, [field]: errs[field] ?? null }));
      return current;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validateForm(values);
      setClientErrors(errs);
      if (hasErrors(errs)) return;

      const quantityNum = Number(values.quantity);
      if (mode === "add") {
        onSubmit({
          name: values.name.trim(),
          quantity: quantityNum,
          unit: values.unit,
          expiration_date: values.expiration_date,
          category: values.category.trim() || undefined,
        });
      } else {
        onSubmit({
          name: values.name.trim(),
          quantity: quantityNum,
          unit: values.unit,
          expiration_date: values.expiration_date,
          category: values.category.trim() || undefined,
        });
      }
    },
    [values, mode, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={values.name}
          onChange={handleChange("name")}
          onBlur={handleBlurStable("name")}
          placeholder="Product name"
          maxLength={NAME_MAX + 1}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          data-test-id="product-form-name"
        />
        {errors.name && (
          <p id={`${nameId}-error`} className="text-sm text-destructive" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={quantityId}>Quantity</Label>
        <Input
          id={quantityId}
          type="number"
          min={QUANTITY_MIN}
          step="0.001"
          value={values.quantity}
          onChange={handleChange("quantity")}
          onBlur={handleBlurStable("quantity")}
          aria-invalid={Boolean(errors.quantity)}
          aria-describedby={errors.quantity ? `${quantityId}-error` : undefined}
          data-test-id="product-form-quantity"
        />
        {errors.quantity && (
          <p id={`${quantityId}-error`} className="text-sm text-destructive" role="alert">
            {errors.quantity}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={unitId}>Unit</Label>
        <select
          id={unitId}
          value={values.unit}
          onChange={handleChange("unit")}
          onBlur={handleBlurStable("unit")}
          data-test-id="product-form-unit"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            errors.unit && "border-destructive"
          )}
          aria-invalid={errors.unit ? "true" : "false"}
          aria-describedby={errors.unit ? `${unitId}-error` : undefined}
        >
          {PRODUCT_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {errors.unit && (
          <p id={`${unitId}-error`} className="text-sm text-destructive" role="alert">
            {errors.unit}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={expirationId}>Expiration date</Label>
        <Input
          id={expirationId}
          type="date"
          value={values.expiration_date}
          onChange={handleChange("expiration_date")}
          onBlur={handleBlurStable("expiration_date")}
          aria-invalid={Boolean(errors.expiration_date)}
          aria-describedby={errors.expiration_date ? `${expirationId}-error` : undefined}
          data-test-id="product-form-expiration-date"
        />
        {errors.expiration_date && (
          <p id={`${expirationId}-error`} className="text-sm text-destructive" role="alert">
            {errors.expiration_date}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={categoryId}>Category (optional)</Label>
        <Input
          id={categoryId}
          value={values.category}
          onChange={handleChange("category")}
          onBlur={handleBlurStable("category")}
          placeholder="e.g. Dairy"
          maxLength={CATEGORY_MAX + 1}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? `${categoryId}-error` : undefined}
          data-test-id="product-form-category"
        />
        {errors.category && (
          <p id={`${categoryId}-error`} className="text-sm text-destructive" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} data-test-id="product-form-cancel">
          Cancel
        </Button>
        <Button type="submit" data-test-id="product-form-submit">
          {mode === "add" ? "Add product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
