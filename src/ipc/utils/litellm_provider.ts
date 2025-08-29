import { LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { FetchFunction } from "@ai-sdk/provider-utils";
import { withoutTrailingSlash } from "@ai-sdk/provider-utils";

type LiteLLMChatModelId = string;

export interface LiteLLMProviderOptions {
  baseURL?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  fetch?: FetchFunction;
}

export interface LiteLLMProvider {
  (modelId: LiteLLMChatModelId): LanguageModel;
}

export function createLiteLLMProvider(
  options?: LiteLLMProviderOptions,
): LiteLLMProvider {
  const base = withoutTrailingSlash(options?.baseURL)!;
  const v1Base = (base.endsWith("/v1") ? base : `${base}/v1`) as string;

  const provider = createOpenAICompatible({
    name: "litellm",
    baseURL: v1Base,
    apiKey: options?.apiKey,
    headers: options?.headers,
  });

  return (modelId: LiteLLMChatModelId) => provider(modelId);
}
