/**
 * OpenRouter client singleton. Built from env; use in API routes and domain services.
 * Server-only; OPENROUTER_API_KEY must be set for AI features.
 * API key is read at runtime (process.env then import.meta.env) so it works in dev and production.
 */

import { OPENROUTER_DEFAULT_MODEL } from "./openrouter.config";
import { createOpenRouterService } from "./openrouter.service";

/** Read at request time so API routes can create a fresh service per request (Option B). */
export function getOpenRouterApiKey(): string | undefined {
  if (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) {
    const key = process.env.OPENROUTER_API_KEY.trim();
    if (key) return key;
  }
  const key = import.meta.env.OPENROUTER_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : undefined;
}

/** Use in API routes to return a clear 503 when the key is missing. */
export function isOpenRouterConfigured(): boolean {
  return !!getOpenRouterApiKey();
}

/**
 * Options with apiKey read lazily so the key is resolved when chat() runs (request time),
 * not when this module loads. Fixes 503 when env is not yet available at module load.
 */
export const openRouter = createOpenRouterService({
  get apiKey() {
    return getOpenRouterApiKey();
  },
  defaultModel: OPENROUTER_DEFAULT_MODEL,
  timeoutMs: 60_000,
});

export { createOpenRouterService } from "./openrouter.service";
export type { OpenRouterService } from "./openrouter.service";
export type {
  OpenRouterMessage,
  OpenRouterResponseFormat,
  OpenRouterChatOptions,
  OpenRouterChatResult,
} from "./openrouter.types";
export {
  OpenRouterError,
  OpenRouterConfigError,
  OpenRouterClientError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterServerError,
  OpenRouterParseError,
} from "./openrouter.errors";
