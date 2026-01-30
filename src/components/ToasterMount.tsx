import { Toaster } from "@/components/ui/sonner";

export function ToasterMount() {
  return (
    <div data-test-id="toaster-mount">
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
