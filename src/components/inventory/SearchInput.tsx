import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  onClear?: () => void;
  "data-test-id"?: string;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function SearchInput({
  value,
  onChange,
  placeholder = "Search products…",
  debounceMs = DEFAULT_DEBOUNCE_MS,
  loading = false,
  onClear,
  "data-test-id": dataTestId,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const valueToEmit = localValue;
    debounceRef.current = setTimeout(() => {
      onChange(valueToEmit);
      debounceRef.current = null;
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localValue, debounceMs, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
    onClear?.();
  }, [onChange, onClear]);

  const showClear = localValue.length > 0;

  return (
    <div className="relative flex items-center gap-2" data-test-id={dataTestId}>
      <Input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products by name or category"
        className={cn("pr-9", loading && "opacity-70")}
        data-test-id={dataTestId ? "inventory-search-input" : undefined}
      />
      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 h-7 w-7 shrink-0 rounded-md"
          onClick={handleClear}
          aria-label="Clear search"
          data-test-id="inventory-search-clear"
        >
          <span aria-hidden>×</span>
        </Button>
      )}
      {loading && (
        <span
          className="absolute right-3 h-4 w-4 animate-pulse rounded-full bg-muted"
          aria-hidden
        />
      )}
    </div>
  );
}
