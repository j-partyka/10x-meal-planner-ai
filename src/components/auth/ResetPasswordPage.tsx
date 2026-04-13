import { useEffect, useState } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

function hasRecoveryHashError(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  return params.has("error");
}

interface ResetPasswordPageProps {
  /** Set from `?error=invalid` (e.g. tests or server-side redirect). */
  queryInvalid?: boolean;
}

/**
 * Detects error fragments from Supabase-style redirects (hash contains `error=`) or `?error=invalid`.
 */
export function ResetPasswordPage({ queryInvalid = false }: ResetPasswordPageProps) {
  const [hashInvalid, setHashInvalid] = useState(false);

  useEffect(() => {
    setHashInvalid(hasRecoveryHashError());
  }, []);

  const invalidLink = queryInvalid || hashInvalid;

  return <ResetPasswordForm invalidLink={invalidLink} />;
}
