/**
 * Types for the OpenRouter service (chat completions API).
 * Used for request/response shapes; service is domain-agnostic.
 */

/** Minimal JSON schema object for response_format (type, properties, required, additionalProperties). */
export interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: unknown;
  description?: string;
  [key: string]: unknown;
}

/** Single message in the chat (system, user, or assistant). */
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Response format for structured output (e.g. JSON schema). */
export interface OpenRouterResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchemaObject;
  };
}

/** Result of a non-streaming chat completion. */
export interface OpenRouterChatResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Options for creating the OpenRouter service. */
export interface OpenRouterServiceOptions {
  /** OpenRouter API key; typically import.meta.env.OPENROUTER_API_KEY. Missing key throws on first use. */
  apiKey: string | undefined;
  /** Base URL for the API; default 'https://openrouter.ai/api/v1'. */
  baseUrl?: string;
  /** Default model id when a call does not specify one; see openrouter.config.ts. */
  defaultModel?: string;
  /** Request timeout in milliseconds; default 60_000. */
  timeoutMs?: number;
}

/** Options for a single chat completion request. */
export interface OpenRouterChatOptions {
  /** Ordered list of messages (system, user, assistant, …). */
  messages: OpenRouterMessage[];
  /** Model id; falls back to defaultModel from service options. */
  model?: string;
  /** When set, request body includes response_format (e.g. JSON schema) for structured output. */
  responseFormat?: OpenRouterResponseFormat;
  /** Sampling temperature (0–2). */
  temperature?: number;
  /** Max completion tokens (max_completion_tokens or max_tokens per API). */
  maxTokens?: number;
  /** Top-p / nucleus sampling (0–1). */
  topP?: number;
  /** Stop sequences. */
  stop?: string | string[];
  /** If true, returns a stream; service focuses on stream: false first. */
  stream?: boolean;
}

/** Internal options passed to buildRequestBody (includes defaultModel from service). */
export interface OpenRouterBuildBodyOptions extends OpenRouterChatOptions {
  defaultModel: string;
}
