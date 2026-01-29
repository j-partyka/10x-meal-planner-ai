/**
 * Consistent JSON response helpers for API routes.
 * Error shape: { error: string } and optionally { details: { field, message }[] } for 400.
 */

export function jsonResponse<T>(body: T, status: number, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    status,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export function errorResponse(
  message: string,
  status: number,
  details?: { field: string; message: string }[]
): Response {
  const body = details ? { error: message, details } : { error: message };
  return jsonResponse(body, status);
}
