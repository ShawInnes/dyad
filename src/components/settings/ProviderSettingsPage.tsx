import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { showError } from "@/lib/toast";
import { UserSettings } from "@/lib/schemas";

import { ProviderSettingsHeader } from "./ProviderSettingsHeader";
import { ApiKeyConfiguration } from "./ApiKeyConfiguration";
import { ApiBaseUrlConfiguration } from "./ApiBaseUrlConfiguration";

import { ModelsSection } from "./ModelsSection";
import { LiteLLMModelsSection } from "@/components/settings/LiteLLMModelsSection.tsx";

interface ProviderSettingsPageProps {
  provider: string;
}

export function ProviderSettingsPage({ provider }: ProviderSettingsPageProps) {
  const {
    settings,
    envVars,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();

  // Fetch all providers
  const {
    data: allProviders,
    isLoading: providersLoading,
    error: providersError,
  } = useLanguageModelProviders();

  // Find the specific provider data from the fetched list
  const providerData = allProviders?.find((p) => p.id === provider);
  const supportsCustomModels =
    providerData?.type === "custom" || providerData?.type === "cloud";

  // Check if this is a LiteLLM provider
  const isLiteLLMProvider =
    providerData?.type === "custom" &&
    (providerData.name.toLowerCase().includes("litellm") ||
      providerData.apiBaseUrl?.includes("litellm"));

  const isDyad = provider === "auto";

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  // Use fetched data (or defaults for Dyad)
  const providerDisplayName = isDyad
    ? "Dyad"
    : (providerData?.name ?? "Unknown Provider");
  const providerWebsiteUrl = isDyad
    ? "https://academy.dyad.sh/settings"
    : providerData?.websiteUrl;
  const providerApiBaseUrl = providerData?.apiBaseUrl;
  const hasFreeTier = isDyad ? false : providerData?.hasFreeTier;
  const envVarName = isDyad ? undefined : providerData?.envVarName;

  // Use provider ID (which is the 'provider' prop)
  const userApiKey = settings?.providerSettings?.[provider]?.apiKey?.value;

  // --- Configuration Logic --- Updated Priority ---
  const isValidUserKey =
    !!userApiKey &&
    !userApiKey.startsWith("Invalid Key") &&
    userApiKey !== "Not Set";
  const hasEnvKey = !!(envVarName && envVars[envVarName]);

  const isConfigured = isValidUserKey || hasEnvKey; // Configured if either is set

  // --- Save Handler ---
  const handleSaveKey = async () => {
    if (!apiKeyInput) {
      setSaveError("API Key cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            apiKey: {
              value: apiKeyInput,
            },
          },
        },
      };
      if (isDyad) {
        settingsUpdate.enableDyadPro = true;
      }
      await updateSettings(settingsUpdate);
      setApiKeyInput(""); // Clear input on success
      // Optionally show a success message
    } catch (error: any) {
      console.error("Error saving API key:", error);
      setSaveError(error.message || "Failed to save API key.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteKey = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSettings({
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            apiKey: undefined,
          },
        },
      });
      // Optionally show a success message
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      setSaveError(error.message || "Failed to delete API key.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Save Handler for API Base URL ---
  const handleSaveApiBaseUrl = async () => {
    if (!apiBaseUrlInput) {
      setSaveError("API Base URL cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            // Note: This assumes we extend the schema to include apiBaseUrl
            apiBaseUrl: {
              value: apiBaseUrlInput,
            },
          },
        },
      };
      await updateSettings(settingsUpdate);
      setApiBaseUrlInput(""); // Clear input on success
    } catch (error: any) {
      console.error("Error saving API base URL:", error);
      setSaveError(error.message || "Failed to save API base URL.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handler for API Base URL ---
  const handleDeleteApiBaseUrl = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSettings({
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            apiBaseUrl: undefined,
          },
        },
      });
    } catch (error: any) {
      console.error("Error deleting API base URL:", error);
      setSaveError(error.message || "Failed to delete API base URL.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Toggle Dyad Pro Handler ---
  const handleToggleDyadPro = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await updateSettings({
        enableDyadPro: enabled,
      });
    } catch (error: any) {
      showError(`Error toggling Dyad Pro: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Effect to clear input error when input changes
  useEffect(() => {
    if (saveError) {
      setSaveError(null);
    }
  }, [apiKeyInput]);

  // --- Loading State for Providers ---
  if (providersLoading) {
    return (
      <div className="min-h-screen px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-10 w-48 mb-4" />
          <div className="space-y-4 mt-6">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error State for Providers ---
  if (providersError) {
    return (
      <div className="min-h-screen px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.history.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mr-3 mb-6">
            Configure Provider
          </h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Provider Details</AlertTitle>
            <AlertDescription>
              Could not load provider data: {providersError.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Handle case where provider is not found (e.g., invalid ID in URL)
  if (!providerData && !isDyad) {
    return (
      <div className="min-h-screen px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.history.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mr-3 mb-6">
            Provider Not Found
          </h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The provider with ID "{provider}" could not be found.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-4xl mx-auto">
        <ProviderSettingsHeader
          providerDisplayName={providerDisplayName}
          isConfigured={isConfigured}
          isLoading={settingsLoading}
          hasFreeTier={hasFreeTier}
          providerWebsiteUrl={providerWebsiteUrl}
          isDyad={isDyad}
          onBackClick={() => router.history.back()}
        />

        {settingsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : settingsError ? (
          <Alert variant="destructive">
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription>
              Could not load configuration data: {settingsError.message}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <ApiKeyConfiguration
              provider={provider}
              providerDisplayName={providerDisplayName}
              settings={settings}
              envVars={envVars}
              envVarName={envVarName}
              isSaving={isSaving}
              saveError={saveError}
              apiKeyInput={apiKeyInput}
              onApiKeyInputChange={setApiKeyInput}
              onSaveKey={handleSaveKey}
              onDeleteKey={handleDeleteKey}
              isDyad={isDyad}
            />

            {/* Add API Base URL Configuration for custom providers */}
            {supportsCustomModels && providerData && (
              <div className="mt-6">
                <ApiBaseUrlConfiguration
                  provider={provider}
                  providerDisplayName={providerDisplayName}
                  settings={settings}
                  defaultApiBaseUrl={providerApiBaseUrl}
                  isSaving={isSaving}
                  saveError={saveError}
                  apiBaseUrlInput={apiBaseUrlInput}
                  onApiBaseUrlInputChange={setApiBaseUrlInput}
                  onSaveUrl={handleSaveApiBaseUrl}
                  onDeleteUrl={handleDeleteApiBaseUrl}
                  isDyad={isDyad}
                />
              </div>
            )}
          </>
        )}

        {isDyad && !settingsLoading && (
          <div className="mt-6 flex items-center justify-between p-4 bg-(--background-lightest) rounded-lg border">
            <div>
              <h3 className="font-medium">Enable Dyad Pro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Toggle to enable Dyad Pro
              </p>
            </div>
            <Switch
              checked={settings?.enableDyadPro}
              onCheckedChange={handleToggleDyadPro}
              disabled={isSaving}
            />
          </div>
        )}

        {/* Conditionally render models section based on provider type */}
        {isLiteLLMProvider ? (
          <LiteLLMModelsSection providerId={providerData.id} />
        ) : supportsCustomModels && providerData ? (
          <ModelsSection providerId={providerData.id} />
        ) : null}

        <div className="h-24"></div>
      </div>
    </div>
  );
}
