import type { MealPlanDto, MealPlanDayDto, MealPlanProductInput, GenerateMealPlanResponse } from "../../types";
import {
  MealPlanAiError,
  MealPlanTimeoutError,
  MealPlanRateLimitError,
  MealPlanProviderError,
} from "./meal-plan.errors";
import type { OpenRouterResponseFormat } from "./openrouter.types";
import type { OpenRouterService } from "./openrouter.service";
import {
  OpenRouterConfigError,
  OpenRouterAuthError,
  OpenRouterClientError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterServerError,
  OpenRouterParseError,
} from "./openrouter.errors";
import { computeShoppingList } from "./shopping-list.service";
import type { InventoryItemForList } from "./shopping-list.service";

/**
 * Family profile (MVP): hardcoded in API per plan.
 */
const FAMILY_PROFILE = `
- 2 adults (moderate activity), 1 child (3 years).
- No dietary restrictions.
- Breakfast: max 10 min prep. Lunch: max 15 min. Dinner: max 30 min.
- Moderate complexity. Suggest leftover reuse (e.g. dinner → next day lunch) where appropriate.
`;

/**
 * Builds expiration priority labels for inventory (≤3 days high, ≤7 days medium).
 */
function expirationPriority(expirationDate: string, today: string): string {
  const exp = new Date(expirationDate);
  const t = new Date(today);
  const daysLeft = Math.ceil((exp.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 3) return " [USE SOON - within 3 days]";
  if (daysLeft <= 7) return " [medium priority - within 7 days]";
  return "";
}

/**
 * Builds the AI prompt with inventory (expiration priority) and family profile.
 * Exported so the API can return the exact prompt that will be sent to the LLM.
 */
export function getMealPlanPrompt(products: MealPlanProductInput[], startDate: string): string {
  return buildPrompt(products, startDate);
}

function buildPrompt(products: MealPlanProductInput[], startDate: string): string {
  const today = startDate;
  const inventoryLines = products.map((p) => {
    const priority = expirationPriority(p.expiration_date, today);
    const cat = p.category ? ` (${p.category})` : "";
    return `- ${p.name}: ${p.quantity} ${p.unit}${cat}, expires ${p.expiration_date}${priority}`;
  });

  return `You are a meal planner. Generate a 7-day meal plan (breakfast, lunch, dinner each day) based on the following inventory and constraints.

**Inventory (use these first; respect expiration priority):**
${inventoryLines.join("\n")}

**Family profile:**${FAMILY_PROFILE}

**Constraints:**
- Plan starts on ${startDate}. Output exactly 7 consecutive days (dates in YYYY-MM-DD).
- Each meal must have: name, ingredients (array of { name, quantity, unit }), instructions (array of strings).
- Use only the units: kg, g, ml, L, pieces. Quantities as numbers.
- Prefer using items marked "USE SOON" in the first days of the plan.

Respond with a single JSON object matching this exact structure (no markdown, no code block):
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "breakfast": { "name": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "..." }], "instructions": ["..."] },
      "lunch": { "name": "...", "ingredients": [...], "instructions": [...] },
      "dinner": { "name": "...", "ingredients": [...], "instructions": [...] }
    }
  ]
}
`;
}

/**
 * Extracts JSON from AI response content (handles optional markdown code block).
 */
function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const codeBlock = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

/**
 * Validates and normalizes AI response into MealPlanDto (ensures 7 days, required fields).
 */
function parseMealPlanResponse(json: unknown): MealPlanDto {
  if (!json || typeof json !== "object" || !("days" in json)) {
    throw new Error("Invalid meal plan response: missing days");
  }
  const days = (json as { days: unknown }).days;
  if (!Array.isArray(days) || days.length < 7) {
    throw new Error("Invalid meal plan response: expected 7 days");
  }

  const normalized: MealPlanDayDto[] = days.slice(0, 7).map((day: unknown, i: number) => {
    if (!day || typeof day !== "object") {
      throw new Error(`Invalid day ${i}: not an object`);
    }
    const d = day as Record<string, unknown>;
    const date = typeof d.date === "string" ? d.date : "";
    const meal = (m: unknown) => {
      if (!m || typeof m !== "object") {
        return { name: "", ingredients: [], instructions: [] };
      }
      const x = m as Record<string, unknown>;
      const ingredients = Array.isArray(x.ingredients)
        ? (x.ingredients as unknown[]).map((ing: unknown) => {
            if (ing && typeof ing === "object") {
              const i = ing as Record<string, unknown>;
              return {
                name: typeof i.name === "string" ? i.name : "",
                quantity: typeof i.quantity === "number" ? i.quantity : 0,
                unit: typeof i.unit === "string" ? i.unit : "",
              };
            }
            return { name: "", quantity: 0, unit: "" };
          })
        : [];
      return {
        name: typeof x.name === "string" ? x.name : "",
        ingredients,
        instructions: Array.isArray(x.instructions) ? x.instructions.map(String) : [],
      };
    };
    return {
      date,
      breakfast: meal(d.breakfast),
      lunch: meal(d.lunch),
      dinner: meal(d.dinner),
    };
  });

  return { days: normalized };
}

const mealSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const },
    ingredients: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          quantity: { type: "number" as const },
          unit: { type: "string" as const },
        },
        required: ["name", "quantity", "unit"] as const,
      },
    },
    instructions: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["name", "ingredients", "instructions"] as const,
};

/** Meal plan JSON schema for structured output (response_format). */
const MEAL_PLAN_RESPONSE_FORMAT: OpenRouterResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_plan",
    strict: true,
    schema: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "YYYY-MM-DD" },
              breakfast: mealSchema,
              lunch: mealSchema,
              dinner: mealSchema,
            },
            required: ["date", "breakfast", "lunch", "dinner"],
          },
        },
      },
      required: ["days"],
      additionalProperties: false,
    },
  },
};

/** Duck-check for OpenRouter-style errors (handles cross-bundle instanceof). */
function isOpenRouterError(err: unknown): err is { message: string; statusCode?: number; retryAfter?: number } {
  return err instanceof Error && "message" in err && typeof (err as { message?: unknown }).message === "string";
}

/**
 * Maps OpenRouter errors to MealPlanAiError so API routes stay unchanged.
 * Uses duck-typing for statusCode so we preserve provider message even if instanceof fails (e.g. multiple bundles).
 */
function mapOpenRouterErrorToMealPlan(err: unknown): never {
  if (err instanceof MealPlanAiError) {
    throw err;
  }
  if (err instanceof OpenRouterTimeoutError) {
    throw new MealPlanTimeoutError();
  }
  if (err instanceof OpenRouterRateLimitError) {
    throw new MealPlanRateLimitError(err.message, err.retryAfter);
  }
  if (
    err instanceof OpenRouterConfigError ||
    err instanceof OpenRouterAuthError ||
    err instanceof OpenRouterClientError ||
    err instanceof OpenRouterServerError ||
    err instanceof OpenRouterParseError
  ) {
    const status = err.statusCode === 502 ? 502 : 503;
    throw new MealPlanProviderError(status as 502 | 503, err.message);
  }
  if (isOpenRouterError(err) && err.statusCode != null) {
    const status = err.statusCode === 502 ? 502 : 503;
    throw new MealPlanProviderError(status as 502 | 503, err.message);
  }
  const message =
    err instanceof Error ? err.message : "Meal plan service is temporarily unavailable. Please try again.";
  throw new MealPlanProviderError(503, message);
}

/**
 * Calls OpenRouter via the provided service. Throws MealPlanAiError on timeout/rate limit/provider errors.
 */
async function callOpenRouter(prompt: string, openRouter: OpenRouterService): Promise<string> {
  try {
    const result = await openRouter.chat({
      messages: [
        { role: "system", content: "You are a meal planner. Output only valid JSON matching the requested schema." },
        { role: "user", content: prompt },
      ],
      maxTokens: 4096,
      temperature: 0.5,
      responseFormat: MEAL_PLAN_RESPONSE_FORMAT,
    });
    return result.content;
  } catch (err) {
    mapOpenRouterErrorToMealPlan(err);
  }
}

/**
 * Converts product-like inventory to shape expected by computeShoppingList.
 */
function toInventoryForList(products: MealPlanProductInput[]): InventoryItemForList[] {
  return products.map((p) => ({
    name: p.name,
    quantity: p.quantity,
    unit: p.unit,
    category: p.category ?? null,
  }));
}

/**
 * Generates a 7-day meal plan using AI and computes the shopping list from meal plan and inventory.
 * openRouter: created per-request in the API route so the API key is read at request time.
 * Throws MealPlanTimeoutError (504), MealPlanRateLimitError (429), MealPlanProviderError (502/503).
 */
export async function generateMealPlan(
  products: MealPlanProductInput[],
  startDate: string,
  openRouter: OpenRouterService
): Promise<GenerateMealPlanResponse> {
  const prompt = buildPrompt(products, startDate);
  const content = await callOpenRouter(prompt, openRouter);
  const json = extractJson(content);
  const mealPlan = parseMealPlanResponse(json);
  const inventory = toInventoryForList(products);
  const shoppingList = computeShoppingList(mealPlan, inventory);
  return { mealPlan, shoppingList, prompt };
}
