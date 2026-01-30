import { useCallback } from "react";
import { supabaseBrowser } from "@/db/supabase.browser";
import { Button } from "@/components/ui/button";

const LOGIN_PATH = "/login";

const navLinks = [
  { href: "/", label: "Inventory" },
  { href: "/meal-plan", label: "Meal plan" },
  { href: "/shopping-list", label: "Shopping list" },
] as const;

export function AppNav() {
  const handleLogout = useCallback(async () => {
    await supabaseBrowser.auth.signOut();
    window.location.href = LOGIN_PATH;
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }
      e.preventDefault();
      window.location.href = href;
    },
    []
  );

  return (
    <nav
      className="flex items-center gap-4 border-b border-border bg-background px-4 py-3"
      aria-label="Main navigation"
      data-test-id="nav"
    >
      <div className="flex flex-1 items-center gap-4">
        {navLinks.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            onClick={(e) => handleNavClick(e, href)}
            data-test-id={
              href === "/"
                ? "nav-link-inventory"
                : href === "/meal-plan"
                  ? "nav-link-meal-plan"
                  : "nav-link-shopping-list"
            }
          >
            {label}
          </a>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        type="button"
        data-test-id="nav-logout"
      >
        Logout
      </Button>
    </nav>
  );
}
