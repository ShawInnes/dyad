import { useAtom } from "jotai";
import {
  litellmModelsAtom,
  litellmModelsErrorAtom,
  litellmModelsLoadingAtom,
} from "@/atoms/localModelsAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { useCallback } from "react";

export function useLiteLLMModels(providerId?: string) {
  const [models, setModels] = useAtom(litellmModelsAtom);
  const [loading, setLoading] = useAtom(litellmModelsLoadingAtom);
  const [error, setError] = useAtom(litellmModelsErrorAtom);

  const ipcClient = IpcClient.getInstance();

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const modelList = await ipcClient.listLocalLiteLLMModels(providerId);
      setModels(modelList);
      setError(null);
      return modelList;
    } catch (error) {
      console.error("Error loading LiteLLM models:", error);

      if (error instanceof Error) {
        if (error.message.includes("Could not connect to LiteLLM")) {
          setError(new Error("LiteLLM service not running or not accessible"));
        } else if (error.message.includes("Invalid channel")) {
          setError(new Error("LiteLLM integration not available"));
        } else {
          setError(error);
        }
      } else {
        setError(new Error("Unknown error loading LiteLLM models"));
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return {
    models,
    loading,
    error,
    loadModels,
  };
}
