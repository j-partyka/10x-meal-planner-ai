import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12 text-center"
      data-test-id="inventory-empty-state"
    >
      <p className="text-muted-foreground">No products in inventory. Add your first product to get started.</p>
      <Button type="button" onClick={onAddClick} data-test-id="inventory-empty-add-product">
        Add product
      </Button>
    </div>
  );
}
