export interface PageHeaderProps {
  title?: string;
}

export function PageHeader({ title = "Inventory" }: PageHeaderProps) {
  return (
    <header>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    </header>
  );
}
