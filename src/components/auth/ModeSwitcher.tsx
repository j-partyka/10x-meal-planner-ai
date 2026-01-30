import type { AuthMode } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeSwitcherProps {
  value: AuthMode;
  onValueChange: (value: AuthMode) => void;
  "data-test-id"?: string;
}

/** Tabs to switch between Sign in and Create account. */
export function ModeSwitcher({ value, onValueChange, "data-test-id": dataTestId }: ModeSwitcherProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as AuthMode)}
      className="w-full"
      data-test-id={dataTestId}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin" data-test-id="auth-tab-signin">
          Sign in
        </TabsTrigger>
        <TabsTrigger value="register" data-test-id="auth-tab-register">
          Create account
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
