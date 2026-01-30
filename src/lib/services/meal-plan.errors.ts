/**
 * Errors thrown by meal-plan service so API routes can map to HTTP status codes.
 */

export class MealPlanAiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 429 | 502 | 503 | 504
  ) {
    super(message);
    this.name = "MealPlanAiError";
  }
}

export class MealPlanTimeoutError extends MealPlanAiError {
  constructor() {
    super("Meal plan generation timed out. Please try again.", 504);
    this.name = "MealPlanTimeoutError";
  }
}

export class MealPlanRateLimitError extends MealPlanAiError {
  /** Suggested wait time in seconds (from Retry-After or provider body). */
  public readonly retryAfter?: number;

  constructor(
    message = "The AI provider is rate-limiting requests. Free tier has strict limits. Please wait and try again.",
    retryAfter?: number
  ) {
    super(message, 429);
    this.name = "MealPlanRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class MealPlanProviderError extends MealPlanAiError {
  constructor(statusCode: 502 | 503, message = "Meal plan service is temporarily unavailable. Please try again.") {
    super(message, statusCode);
    this.name = "MealPlanProviderError";
  }
}
