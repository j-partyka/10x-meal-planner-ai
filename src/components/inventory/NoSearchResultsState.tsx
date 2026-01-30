import { Button } from "@/components/ui/button";

export interface NoSearchResultsStateProps {
  onClearSearch: () => void;
}

export function NoSearchResultsState({ onClearSearch }: NoSearchResultsStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12 text-center"
      data-test-id="inventory-no-search-results"
    >
      <p className="text-muted-foreground">No products match your search.</p>
      <Button type="button" variant="outline" onClick={onClearSearch} data-test-id="inventory-clear-search">
        Clear search
      </Button>
    </div>
  );
}
