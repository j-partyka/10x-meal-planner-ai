export interface PageHeaderProps {
  title?: string;
  /** Optional id for the h1 so main can use aria-labelledby for the landmark. */
  titleId?: string;
}

export function PageHeader({ title = "Inventory", titleId }: PageHeaderProps) {
  return (
    <header data-test-id={title === "Inventory" ? "inventory-header" : title === "Meal Plan" ? "meal-plan-header" : title === "Shopping List" ? "shopping-list-header" : undefined}>
      <h1
        id={titleId}
        className="text-2xl font-semibold text-foreground"
      >
        {title}
      </h1>
    </header>
  );
}
