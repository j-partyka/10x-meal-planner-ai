import type { AuthMode } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeSwitcherProps {
  value: AuthMode;
  onValueChange: (value: AuthMode) => void;
}

/** Tabs to switch between Sign in and Create account. */
export function ModeSwitcher({ value, onValueChange }: ModeSwitcherProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as AuthMode)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="register">Create account</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
