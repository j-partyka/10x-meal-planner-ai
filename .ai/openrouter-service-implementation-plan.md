# OpenRouter Service Implementation Plan

## 1. Service Description

The **OpenRouter service** is a server-side TypeScript module that wraps the [OpenRouter API](https://openrouter.ai/docs/api-reference/chat/send-chat-completion-request) for chat completions. It provides a single, reusable entry point for all LLM-based features (e.g. meal plan generation) while keeping API keys and request logic out of individual API routes and domain services.

**Responsibilities:**

- Build and send chat completion requests to `https://openrouter.ai/api/v1/chat/completions`.
- Support system message, user message(s), optional `response_format` (JSON schema), model selection, and standard model parameters (temperature, max_tokens, etc.).
- Map OpenRouter errors (400, 401, 429, 502, 503, 504, etc.) to typed, domain-agnostic errors suitable for Astro API routes.
- Enforce timeout and avoid leaking the API key to the client.

**Placement in project:** `src/lib/services/openrouter.service.ts`. API routes and domain services (e.g. `meal-plan.service.ts`) call this service; the service does not depend on domain types beyond generic request/response shapes.

**Tech stack alignment:** TypeScript 5, Astro API endpoints (server-only), environment variable for `OPENROUTER_API_KEY`, no client-side usage.

---

## 2. Constructor Description

The service is implemented as a **factory function** that returns an object with methods, so configuration is explicit and testable without global state.

**Signature:**

```ts
function createOpenRouterService(options: OpenRouterServiceOptions): OpenRouterService
```

**Options:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | `string \| undefined` | Yes (runtime) | OpenRouter API key; typically `import.meta.env.OPENROUTER_API_KEY`. Service should treat missing key as misconfiguration and throw on first use. |
| `baseUrl` | `string` | No | Base URL for the API; default `'https://openrouter.ai/api/v1'`. |
| `defaultModel` | `string` | No | Default model id when a call does not specify one; e.g. `'openai/gpt-4o-mini'`. |
| `timeoutMs` | `number` | No | Request timeout in milliseconds; default e.g. `60_000`. |

**Example:**

```ts
const openRouter = createOpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'openai/gpt-4o-mini',
  timeoutMs: 60_000,
});
```

No constructor in the sense of a class; the “constructor” is this factory. Call it once per process (e.g. in a small `src/lib/services/openrouter.ts` that re-exports the singleton instance built from env).

---

## 3. Public Methods and Fields

### 3.1 `chat(options: OpenRouterChatOptions): Promise<OpenRouterChatResult>`

Sends a non-streaming chat completion request and returns the first assistant message content and optional usage.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | `OpenRouterMessage[]` | Yes | Ordered list of messages (system, user, assistant, …). |
| `model` | `string` | No | Model id; falls back to `defaultModel` from options. |
| `responseFormat` | `OpenRouterResponseFormat \| undefined` | No | When set, request body includes `response_format` (e.g. JSON schema) for structured output. |
| `temperature` | `number \| undefined` | No | Sampling temperature (0–2). |
| `maxTokens` | `number \| undefined` | No | Max completion tokens (e.g. `max_completion_tokens` or `max_tokens` per API). |
| `topP` | `number \| undefined` | No | Top-p / nucleus sampling (0–1). |
| `stop` | `string \| string[] \| undefined` | No | Stop sequences. |
| `stream` | `boolean` | No | If `true`, returns a stream; plan focuses on `stream: false` first. |

**Returns:** `Promise<OpenRouterChatResult>` where:

- `content: string` — raw text of the first assistant message (or concatenated deltas if streaming later).
- `usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }` when the API includes it.

**Throws:** Typed errors (see Error handling): e.g. missing API key, timeout, 4xx/5xx mapped to `OpenRouterError` (or subclasses) with status and message.

---

### 3.2 Types Exposed by the Service

- **`OpenRouterMessage`**  
  `{ role: 'system' | 'user' | 'assistant'; content: string }`

- **`OpenRouterResponseFormat`**  
  For JSON schema:  
  `{ type: 'json_schema'; json_schema: { name: string; strict: boolean; schema: JsonSchemaObject } }`  
  Where `JsonSchemaObject` is a minimal type describing the schema (e.g. `type`, `properties`, `required`, `additionalProperties`).

- **`OpenRouterChatResult`**  
  `{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }`

These types can live in `src/lib/services/openrouter.types.ts` or in the same file as the service.

---

## 4. Private Methods and Fields

- **`buildRequestBody(options)`**  
  Builds the JSON body for `POST .../chat/completions`: `messages`, `model`, optional `response_format`, `temperature`, `max_tokens` / `max_completion_tokens`, `top_p`, `stop`, `stream`. Ensures `response_format` is sent exactly as the API expects (see examples below).

- **`getApiKey(): string`**  
  Returns the API key from options; throws a dedicated error if missing (e.g. `OpenRouterConfigError`).

- **`fetchWithTimeout(url, requestInit, timeoutMs): Promise<Response>`**  
  Uses `fetch` with `AbortController` and `setTimeout` to enforce timeout; on timeout, aborts and throws a timeout error.

- **`handleResponse(response: Response): Promise<OpenRouterChatResult>`**  
  Checks `response.ok`; if not ok, reads error body (OpenRouter error shape), maps status to typed error and throws. If ok, parses JSON, reads `choices[0].message.content` and optional `usage`, returns `{ content, usage }`.

- **`mapError(status: number, body?: unknown)`**  
  Maps HTTP status (400, 401, 402, 403, 408, 429, 500, 502, 503, etc.) and optional body to the appropriate error type (config, bad request, auth, rate limit, timeout, server/provider).

Internal state is limited to the options object captured in the closure (apiKey, baseUrl, defaultModel, timeoutMs). No other private fields are required.

---

## 5. Error Handling

### 5.1 Error Scenarios (Numbered)

1. **Missing or invalid API key** — Key not set or empty when building request.
2. **Bad Request (400)** — Invalid request body (e.g. invalid messages, invalid schema in `response_format`, unsupported parameter).
3. **Unauthorized (401)** — Invalid or disabled API key.
4. **Insufficient credits (402)** — Account has no credits (if applicable).
5. **Moderation / forbidden (403)** — Input flagged by moderation; optional metadata in body.
6. **Request timeout (408 or client-side timeout)** — No response within `timeoutMs` or server 408.
7. **Rate limit (429)** — Too many requests; retry-after may be in headers or body.
8. **Server / provider errors (500, 502, 503)** — OpenRouter or upstream model failure.
9. **Empty or malformed success response** — Response ok but missing `choices[0].message.content` or invalid JSON.
10. **Network / fetch failure** — No response (e.g. DNS, connection refused); treat as unreachable.

### 5.2 Recommended Error Types

- **`OpenRouterConfigError`** — Missing API key (scenario 1); status not applicable or 503 for “service misconfigured”.
- **`OpenRouterClientError`** — 400, 402, 403 (scenarios 2, 4, 5); include status and message (and optional parsed body).
- **`OpenRouterAuthError`** — 401 (scenario 3).
- **`OpenRouterRateLimitError`** — 429 (scenario 7); optional `retryAfter` if present.
- **`OpenRouterTimeoutError`** — Client timeout or 408 (scenario 6).
- **`OpenRouterServerError`** — 500, 502, 503 (scenario 8); include status and message.
- **`OpenRouterParseError`** — Valid HTTP response but invalid or empty content (scenario 9).

All can extend a base `OpenRouterError` with `name`, `message`, and optional `statusCode: number` so API routes can map to HTTP status (e.g. 429 → 429, 503 → 503, config → 503).

### 5.3 Behavior

- Use guard clauses: e.g. if no API key, throw immediately; if `!response.ok`, parse body and throw mapped error.
- Log server-side only (e.g. existing `logServerError`); do not log request/response bodies or API key.
- Do not retry inside the service; let the caller (e.g. meal-plan route) decide retry policy.

---

## 6. Security Considerations

- **API key:** Read only from server environment (`import.meta.env.OPENROUTER_API_KEY`). Never send to the client or log. The service is only used from Astro API routes or other server code.
- **Input:** Validate and sanitize only what is necessary for the API (e.g. message roles and content type). Avoid passing unsanitized user input directly into logs.
- **Output:** Do not expose OpenRouter error details verbatim to the client; map to generic messages and status codes in the API layer.
- **HTTPS:** All requests go to `https://openrouter.ai`; no sensitive data in URL query params.
- **Dependencies:** Use native `fetch` and `AbortController`; no extra npm dependency required for the client.

---

## 7. Step-by-Step Implementation Plan

### Step 1: Types and error classes

- Create `src/lib/services/openrouter.types.ts` (or equivalent) with:
  - `OpenRouterMessage`, `OpenRouterResponseFormat`, `JsonSchemaObject`, `OpenRouterChatResult`, `OpenRouterServiceOptions`, `OpenRouterChatOptions`.
- Create `src/lib/services/openrouter.errors.ts` with:
  - `OpenRouterError` (base) and the specific classes listed in section 5.2, each with a clear `message` and optional `statusCode`.

### Step 2: Request body shape and OpenRouter compliance

- Implement `buildRequestBody` so that:
  - **System message:** Included as an element in `messages` with `role: 'system'` and `content: string`. Example: `messages: [{ role: 'system', content: 'You are a meal planner.' }, { role: 'user', content: '...' }]`.
  - **User message(s):** One or more `{ role: 'user', content: string }` in `messages`. Multiple user/assistant turns are supported by ordering.
  - **response_format (JSON schema):** When `responseFormat` is provided, set body field:
    - `response_format: { type: 'json_schema', json_schema: { name: string, strict: true, schema: object } }`.
    - Use exact keys `json_schema` and `response_format` (snake_case) as the OpenRouter API expects. Example:

```ts
// Example: building response_format for a meal plan
const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'meal_plan',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'YYYY-MM-DD' },
              breakfast: { type: 'object', properties: { name: { type: 'string' }, ingredients: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' } }, required: ['name', 'quantity', 'unit'] } }, instructions: { type: 'array', items: { type: 'string' } } }, required: ['name', 'ingredients', 'instructions'] },
              lunch: { /* same shape */ },
              dinner: { /* same shape */ },
            },
            required: ['date', 'breakfast', 'lunch', 'dinner'],
          },
        },
      },
      required: ['days'],
      additionalProperties: false,
    },
  },
};
```

  - **Model name:** Set `model: options.model ?? this.defaultModel` in the body (string).
  - **Model parameters:** Map options to API keys: `temperature`, `max_tokens` or `max_completion_tokens`, `top_p`, `stop`; only include keys that are defined.

### Step 3: HTTP client and timeout

- Implement `fetchWithTimeout`: build `RequestInit` with `method: 'POST'`, `headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }`, `body: JSON.stringify(body)`, and `signal` from an `AbortController` with `setTimeout(..., timeoutMs)`. On `AbortError`, throw `OpenRouterTimeoutError`.
- Call OpenRouter at `baseUrl + '/chat/completions'`.

### Step 4: Response handling and error mapping

- Implement `handleResponse`:
  - If `!response.ok`: read `await response.json().catch(() => ({}))`, then call `mapError(response.status, body)` and throw.
  - If ok: parse JSON, read `choices[0].message.content` (string) and optional `usage`; if content is missing or not a string, throw `OpenRouterParseError`; otherwise return `{ content, usage }`.
- Implement `mapError(status, body)` to throw the appropriate error class (e.g. 429 → `OpenRouterRateLimitError`) and optionally attach a message from `body.error?.message` or similar.

### Step 5: Factory and public `chat` method

- Implement `createOpenRouterService(options)`:
  - Store options in closure.
  - Implement `getApiKey()` to return options.apiKey or throw `OpenRouterConfigError`.
  - Implement `chat(options)`:
    - Call `getApiKey()`.
    - Build body with `buildRequestBody({ ...options, defaultModel, ... })`.
    - Call `fetchWithTimeout(url, init, timeoutMs)`.
    - Call `handleResponse(response)` and return its result.
  - Return object `{ chat }` (and optionally `buildRequestBody` for tests).

### Step 6: Integration and env

- Add a single place that calls `createOpenRouterService({ apiKey: import.meta.env.OPENROUTER_API_KEY, defaultModel: 'openai/gpt-4o-mini', timeoutMs: 60_000 })` and re-export the instance (e.g. `src/lib/services/openrouter.ts` or `openrouter.client.ts`). Use this instance in `meal-plan.service.ts` instead of inlining `fetch` to OpenRouter.
- Refactor `meal-plan.service.ts`: replace direct `callOpenRouter` with the new service’s `chat` method; pass system + user messages and, if desired, a `responseFormat` built from the meal-plan JSON schema so the model returns structured JSON without markdown. Keep parsing/validation in the meal-plan service; the OpenRouter service stays generic.

### Step 7: Tests and documentation

- Unit tests (optional but recommended): mock `fetch`, test `buildRequestBody` for correct `messages`, `response_format`, `model`, and parameters; test `mapError` for 400, 401, 429, 503; test timeout throws.
- Document in the plan or README: env var `OPENROUTER_API_KEY`, that the service is server-only, and that structured output uses `response_format` with `type: 'json_schema'` and `strict: true`.

---

## Documentation (OpenRouter service)

- **Environment:** Set `OPENROUTER_API_KEY` in your server environment (e.g. `.env`) for AI features. The service throws on first use if the key is missing.
- **Server-only:** The OpenRouter service is used only from Astro API routes or other server code. Never import it in client-side components or expose the API key to the client.
- **Structured output:** For JSON output (e.g. meal plans), use `response_format` with `type: 'json_schema'`, `json_schema.strict: true`, and a JSON schema object. The model returns raw JSON without markdown code blocks.

---

## Appendix: OpenRouter API Elements (Concise Reference)

| Element | Implementation |
|--------|-----------------|
| **System message** | One or more `{ role: 'system', content: string }` in `messages` array (usually first). |
| **User message** | One or more `{ role: 'user', content: string }` in `messages`. |
| **response_format** | Body field: `response_format: { type: 'json_schema', json_schema: { name: string, strict: true, schema: object } }`; use snake_case and strict schema. |
| **Model name** | Body field: `model: string` (e.g. `'openai/gpt-4o-mini'`). |
| **Model parameters** | Body fields: `temperature`, `max_tokens` or `max_completion_tokens`, `top_p`, `stop` as per OpenRouter docs; include only when provided. |

All of the above are applied in `buildRequestBody` and then sent in a single `POST` to the chat completions endpoint with Bearer token authentication.
