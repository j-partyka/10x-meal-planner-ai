/**
 * Errors thrown by meal-plan service so API routes can map to HTTP status codes.
 */

export class MealPlanAiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 429 | 502 | 503 | 504
  ) {
    super(message);
    this.name = 'MealPlanAiError';
  }
}

export class MealPlanTimeoutError extends MealPlanAiError {
  constructor() {
    super('Meal plan generation timed out. Please try again.', 504);
    this.name = 'MealPlanTimeoutError';
  }
}

export class MealPlanRateLimitError extends MealPlanAiError {
  constructor() {
    super('Too many requests. Please try again later.', 429);
    this.name = 'MealPlanRateLimitError';
  }
}

export class MealPlanProviderError extends MealPlanAiError {
  constructor(statusCode: 502 | 503) {
    super('Meal plan service is temporarily unavailable. Please try again.', statusCode);
    this.name = 'MealPlanProviderError';
  }
}
