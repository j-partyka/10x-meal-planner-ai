/**
 * OpenRouter service: server-side wrapper for OpenRouter chat completions API.
 * Single entry point for LLM features; keeps API keys and request logic out of routes.
 * Server-only; use from Astro API routes or domain services.
 */

import type {
  OpenRouterBuildBodyOptions,
  OpenRouterChatOptions,
  OpenRouterChatResult,
  OpenRouterServiceOptions,
} from './openrouter.types';
import {
  OpenRouterAuthError,
  OpenRouterClientError,
  OpenRouterConfigError,
  OpenRouterParseError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterTimeoutError,
} from './openrouter.errors';
import { OPENROUTER_DEFAULT_MODEL } from './openrouter.config';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = OPENROUTER_DEFAULT_MODEL;
const DEFAULT_TIMEOUT_MS = 60_000;

/** Public interface: chat completion. */
export interface OpenRouterService {
  chat(options: OpenRouterChatOptions): Promise<OpenRouterChatResult>;
}

/**
 * Builds the JSON body for POST .../chat/completions.
 * Uses snake_case keys and includes only defined parameters.
 */
function buildRequestBody(opts: OpenRouterBuildBodyOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    messages: opts.messages,
    model: opts.model ?? opts.defaultModel,
    stream: opts.stream ?? false,
  };

  if (opts.responseFormat !== undefined) {
    body.response_format = {
      type: opts.responseFormat.type,
      json_schema: {
        name: opts.responseFormat.json_schema.name,
        strict: opts.responseFormat.json_schema.strict,
        schema: opts.responseFormat.json_schema.schema,
      },
    };
  }

  if (opts.temperature !== undefined) {
    body.temperature = opts.temperature;
  }
  if (opts.maxTokens !== undefined) {
    body.max_tokens = opts.maxTokens;
  }
  if (opts.topP !== undefined) {
    body.top_p = opts.topP;
  }
  if (opts.stop !== undefined) {
    body.stop = opts.stop;
  }

  return body;
}

/**
 * Fetches with AbortController and timeout. On timeout, aborts and throws OpenRouterTimeoutError.
 */
async function fetchWithTimeout(
  url: string,
  requestInit: RequestInit,
  timeoutMsParam: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMsParam);

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OpenRouterTimeoutError(
        `OpenRouter request timed out after ${timeoutMsParam}ms.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Parses Retry-After header: seconds (number) or HTTP-date. Returns seconds to wait, or undefined. */
function parseRetryAfterHeader(header: string | null): number | undefined {
  if (!header?.trim()) return undefined;
  const n = parseInt(header.trim(), 10);
  if (!Number.isNaN(n) && n >= 0) return n;
  const date = new Date(header);
  if (!Number.isNaN(date.getTime())) {
    const seconds = Math.ceil((date.getTime() - Date.now()) / 1000);
    return Math.max(0, seconds);
  }
  return undefined;
}

/** Maps HTTP status and optional body to typed OpenRouter errors (Step 4). */
function mapError(
  status: number,
  body?: unknown,
  retryAfterFromHeader?: number
): never {
  const errorBody = body as { error?: { message?: string }; retry_after?: number } | undefined;
  const message = errorBody?.error?.message ?? `OpenRouter API error: ${status}`;

  if (status === 401) {
    throw new OpenRouterAuthError(message);
  }
  if (status === 429) {
    const retryAfter = errorBody?.retry_after ?? retryAfterFromHeader;
    throw new OpenRouterRateLimitError(message, retryAfter);
  }
  if (status === 408) {
    throw new OpenRouterTimeoutError(message);
  }
  if (status >= 400 && status < 500) {
    throw new OpenRouterClientError(message, status, body);
  }
  if (status >= 500) {
    throw new OpenRouterServerError(message, status);
  }
  throw new OpenRouterClientError(message, status, body);
}

/** Parses response: on !ok calls mapError (throws); on ok returns content and usage. */
async function handleResponse(response: Response): Promise<OpenRouterChatResult> {
  if (!response.ok) {
    const bodyUnknown = await response.json().catch(() => ({}));
    const msg = (bodyUnknown as { error?: { message?: string } })?.error?.message;
    console.error(
      `[OpenRouter] ${response.status} ${response.statusText}${msg ? `: ${msg}` : ''}`
    );
    const retryAfter =
      response.status === 429
        ? parseRetryAfterHeader(response.headers.get('Retry-After'))
        : undefined;
    mapError(response.status, bodyUnknown, retryAfter);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new OpenRouterParseError(
      data?.choices?.length
        ? 'Assistant message content was missing or not a string.'
        : 'OpenRouter response was invalid or empty.'
    );
  }
  return { content, usage: data.usage };
}

/**
 * Creates the OpenRouter service instance. Call once per process (e.g. re-export singleton from env).
 */
export function createOpenRouterService(options: OpenRouterServiceOptions): OpenRouterService {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const defaultModel = options.defaultModel ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    async chat(chatOptions: OpenRouterChatOptions): Promise<OpenRouterChatResult> {
      const apiKey = options.apiKey;
      if (!apiKey || apiKey.trim() === '') {
        throw new OpenRouterConfigError();
      }
      const body = buildRequestBody({
        ...chatOptions,
        defaultModel,
      });
      const url = `${baseUrl}/chat/completions`;
      const init: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      };
      const response = await fetchWithTimeout(url, init, timeoutMs);
      return handleResponse(response);
    },
  };
}
