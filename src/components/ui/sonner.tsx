import { Toaster as SonnerToaster } from "sonner";

import { cn } from "@/lib/utils";

function Toaster({ className, ...props }: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      className={cn("sonner-toaster", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toast]:border-green-500/50 group-[.toast]:text-green-600 dark:group-[.toast]:text-green-400",
          error: "group-[.toast]:border-destructive/50 group-[.toast]:text-destructive",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
