/**
 * E2E auth helpers. Credentials come from .env.test (loaded in playwright.config).
 */
export function getE2ECredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function hasE2ECredentials(): boolean {
  return getE2ECredentials() !== null;
}
