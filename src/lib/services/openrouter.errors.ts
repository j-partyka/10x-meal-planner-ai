/**
 * Typed errors for the OpenRouter service.
 * All extend OpenRouterError so API routes can map to HTTP status (e.g. 429 → 429, 503 → 503).
 */

/** Base error for OpenRouter; includes optional statusCode for API layer mapping. */
export class OpenRouterError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/** Missing API key (scenario 1); status not applicable or 503 for "service misconfigured". */
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string = 'OpenRouter service is misconfigured: API key is missing.') {
    super(message, 503);
    this.name = 'OpenRouterConfigError';
    Object.setPrototypeOf(this, OpenRouterConfigError.prototype);
  }
}

/** 400, 402, 403 (bad request, insufficient credits, moderation/forbidden). */
export class OpenRouterClientError extends OpenRouterError {
  constructor(
    message: string,
    statusCode: number,
    public readonly body?: unknown
  ) {
    super(message, statusCode);
    this.name = 'OpenRouterClientError';
    Object.setPrototypeOf(this, OpenRouterClientError.prototype);
  }
}

/** 401 invalid or disabled API key. */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string = 'OpenRouter API key is invalid or disabled.') {
    super(message, 401);
    this.name = 'OpenRouterAuthError';
    Object.setPrototypeOf(this, OpenRouterAuthError.prototype);
  }
}

/** 429 too many requests; optional retryAfter if present. */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string = 'OpenRouter rate limit exceeded.',
    public readonly retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'OpenRouterRateLimitError';
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}

/** Client timeout or 408. */
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string = 'OpenRouter request timed out.') {
    super(message, 408);
    this.name = 'OpenRouterTimeoutError';
    Object.setPrototypeOf(this, OpenRouterTimeoutError.prototype);
  }
}

/** 500, 502, 503 server/provider errors. */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'OpenRouterServerError';
    Object.setPrototypeOf(this, OpenRouterServerError.prototype);
  }
}

/** Valid HTTP response but invalid or empty content (e.g. missing choices[0].message.content). */
export class OpenRouterParseError extends OpenRouterError {
  constructor(message: string = 'OpenRouter response was invalid or empty.') {
    super(message);
    this.name = 'OpenRouterParseError';
    Object.setPrototypeOf(this, OpenRouterParseError.prototype);
  }
}
