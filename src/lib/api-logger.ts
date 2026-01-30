/* eslint-disable no-console -- logging utility for routes */
/**
 * Consistent API logging for routes. No PII (no user ids, request bodies) in logs.
 * Use for validation failures (debug) and server/AI errors (error with context).
 */

export function logValidationFailure(route: string, details: { field: string; message: string }[]): void {
  if (details.length === 0) {
    console.debug(`[${route}] Validation failed`);
    return;
  }
  const fields = details.map((d) => d.field).join(", ");
  console.debug(`[${route}] Validation failed: ${fields}`);
}

export function logServerError(route: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${route}]`, message);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}
