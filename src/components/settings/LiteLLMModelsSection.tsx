import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLiteLLMModels } from "@/hooks/useLiteLLMModels";
import type { LocalModel } from "@/ipc/ipc_types";

interface LiteLLMModelsSectionProps {
  providerId: string;
}

export function LiteLLMModelsSection({
  providerId,
}: LiteLLMModelsSectionProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    loadModels,
  } = useLiteLLMModels(providerId);

  // Load models when component mounts or providerId changes
  useEffect(() => {
    loadModels();
  }, [providerId]);

  const handleModelClick = (modelName: string) => {
    setSelectedModel(selectedModel === modelName ? null : modelName);
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-2xl font-semibold mb-4">Available Models</h2>
      <p className="text-muted-foreground mb-4">
        Models currently loaded in your LiteLLM service.
      </p>

      {/* Loading State */}
      {modelsLoading && (
        <div className="space-y-3 mt-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {/* Error State */}
      {modelsError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Models</AlertTitle>
          <AlertDescription>{modelsError.message}</AlertDescription>
        </Alert>
      )}

      {/* Models List */}
      {!modelsLoading && !modelsError && models && models.length > 0 && (
        <div className="mt-4 space-y-3">
          {models.map((model: LocalModel) => (
            <div
              key={model.modelName}
              className={`p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                selectedModel === model.modelName
                  ? "ring-2 ring-blue-500 dark:ring-blue-400"
                  : ""
              }`}
              onClick={() => handleModelClick(model.modelName)}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {model.displayName}
                </h4>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {model.modelName}
              </p>
              <div className="flex flex-wrap gap-x-2">
                <span className="mt-2 inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                  LiteLLM
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!modelsLoading && !modelsError && (!models || models.length === 0) && (
        <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-muted-foreground text-center">
            No models are currently loaded in your LiteLLM service.
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Make sure your LiteLLM service is running and has models configured.
          </p>
        </div>
      )}
    </div>
  );
}
