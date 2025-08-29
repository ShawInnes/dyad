import { ipcMain } from "electron";
import log from "electron-log";
import type { LocalModel, LocalModelListResponse } from "../ipc_types";
import { getLanguageModelProviders } from "@/ipc/shared/language_model_helpers.ts";
import { readSettings } from "@/main/settings.ts";

const logger = log.scope("litellm_handler");

interface LiteLLMModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}
export async function fetchLiteLLMModels(config?: {
  apiUrl?: string;
  apiKey?: string;
}): Promise<LocalModelListResponse> {
  const apiUrl = config?.apiUrl;
  const apiKey = config?.apiKey;

  // Return empty response if either apiUrl or apiKey is empty
  if (!apiUrl || !apiKey) {
    logger.info(
      `LiteLLM configuration incomplete: apiUrl=${!!apiUrl}, apiKey=${!!apiKey}`,
    );
    return { models: [] };
  }

  logger.info(`Attempting to connect to LiteLLM at ${apiUrl}`);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiUrl}/v1/models`, {
      headers,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `LiteLLM models endpoint not found at ${apiUrl}/v1/models. Verify LiteLLM is running and the URL is correct.`,
        );
      }
      if (response.status === 401) {
        throw new Error(`Authentication failed. Check your LiteLLM API key.`);
      }
      throw new Error(
        `Failed to fetch models from LiteLLM: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const litellmModels: LiteLLMModel[] = data.data || [];

    const models: LocalModel[] = litellmModels.map((model: LiteLLMModel) => {
      // Create a user-friendly display name
      const displayName = model.id
        .replace(/[_-]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        modelName: model.id,
        displayName,
        provider: "litellm",
      };
    });

    logger.info(`Successfully fetched ${models.length} models from LiteLLM`);
    return { models };
  } catch (error) {
    logger.error(`Error fetching LiteLLM models from ${apiUrl}:`, error);

    // Handle specific error types
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(
        `Cannot connect to LiteLLM at ${apiUrl}. Please ensure LiteLLM is running and accessible.`,
      );
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(
        `Connection to LiteLLM at ${apiUrl} timed out. Check if the service is running and responsive.`,
      );
    }

    // Re-throw errors we've already formatted
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unknown errors
    throw new Error(`Failed to fetch models from LiteLLM: ${String(error)}`);
  }
}

export function registerLiteLLMHandlers() {
  ipcMain.handle(
    "local-models:list-litellm",
    async (_, providerId: string): Promise<LocalModelListResponse> => {
      try {
        // Get all providers and settings
        const [providers, settings] = await Promise.all([
          getLanguageModelProviders(),
          readSettings(),
        ]);

        let configApiUrl: string | undefined;
        let configApiKey: string | undefined;

        // Look for the specific provider by ID
        const litellmProvider = providers.find((p) => p.id === providerId);

        if (litellmProvider) {
          configApiUrl =
            settings.providerSettings?.[providerId]?.apiBaseUrl?.value;
          configApiKey = settings.providerSettings?.[providerId]?.apiKey?.value;
        }

        // The fetchLiteLLMModels function will now properly fall back to env vars
        // when configApiUrl or configApiKey are undefined
        return fetchLiteLLMModels({
          apiUrl: configApiUrl,
          apiKey: configApiKey,
        });
      } catch (error) {
        logger.error("Error in list-litellm handler:", error);
        throw error;
      }
    },
  );
}
