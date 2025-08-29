import { Globe, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/lib/schemas";

// Helper function to display API base URL (no masking needed unlike API keys)
const displayApiBaseUrl = (url: string | undefined): string => {
  if (!url) return "Not Set";
  return url;
};

interface ApiBaseUrlConfigurationProps {
  provider: string;
  providerDisplayName: string;
  settings: UserSettings | null | undefined;
  defaultApiBaseUrl?: string; // The provider's default API base URL
  isSaving: boolean;
  saveError: string | null;
  apiBaseUrlInput: string;
  onApiBaseUrlInputChange: (value: string) => void;
  onSaveUrl: () => Promise<void>;
  onDeleteUrl: () => Promise<void>;
  isDyad: boolean;
}

export function ApiBaseUrlConfiguration({
  provider,
  providerDisplayName,
  settings,
  defaultApiBaseUrl,
  isSaving,
  saveError,
  apiBaseUrlInput,
  onApiBaseUrlInputChange,
  onSaveUrl,
  onDeleteUrl,
  isDyad,
}: ApiBaseUrlConfigurationProps) {
  // Assuming we extend the schema to include apiBaseUrl in provider settings
  const userApiBaseUrl =
    settings?.providerSettings?.[provider]?.apiBaseUrl?.value;

  const isValidUserUrl = !!userApiBaseUrl && userApiBaseUrl !== "Not Set";
  const hasDefaultUrl = !!defaultApiBaseUrl;

  // Determine which section to show
  const showSettingsSection = true; // Always show settings section for configuration
  const showDefaultSection = !isDyad && hasDefaultUrl && !isValidUserUrl; // Only show default when no custom URL is set

  return (
    <Accordion
      type="multiple"
      className="w-full space-y-4"
      defaultValue={["settings-url"]} // Always open settings section by default
    >
      {showSettingsSection && (
        <AccordionItem
          value="settings-url"
          className="border rounded-lg px-4 bg-(--background-lightest)"
        >
          <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
            API Base URL Configuration
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            {isValidUserUrl && (
              <Alert variant="default" className="mb-4">
                <Globe className="h-4 w-4" />
                <AlertTitle className="flex justify-between items-center">
                  <span>Current Custom URL</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteUrl}
                    disabled={isSaving}
                    className="flex items-center gap-1 h-7 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isSaving ? "Deleting..." : "Delete"}
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  <p className="font-mono text-sm">{userApiBaseUrl}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This custom URL is currently active.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label
                htmlFor="apiBaseUrlInput"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {isValidUserUrl ? "Update" : "Set"} {providerDisplayName} API
                Base URL
              </label>
              <div className="flex items-start space-x-2">
                <Input
                  id="apiBaseUrlInput"
                  value={apiBaseUrlInput}
                  onChange={(e) => onApiBaseUrlInputChange(e.target.value)}
                  placeholder={`Enter custom ${providerDisplayName} API Base URL`}
                  className={`flex-grow ${saveError ? "border-red-500" : ""}`}
                />
                <Button
                  onClick={onSaveUrl}
                  disabled={isSaving || !apiBaseUrlInput}
                >
                  {isSaving ? "Saving..." : "Save URL"}
                </Button>
              </div>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isValidUserUrl
                  ? "Update or delete your custom URL above to use the provider's default."
                  : hasDefaultUrl
                    ? "Setting a custom URL here will override the provider's default API base URL."
                    : "Set a custom API base URL for this provider."}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {showDefaultSection && (
        <AccordionItem
          value="default-url"
          className="border rounded-lg px-4 bg-(--background-lightest)"
        >
          <AccordionTrigger className="text-lg font-medium hover:no-underline cursor-pointer">
            Default API Base URL
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <Alert variant="default">
              <Globe className="h-4 w-4" />
              <AlertTitle>Provider Default URL</AlertTitle>
              <AlertDescription>
                <p className="font-mono text-sm">
                  {displayApiBaseUrl(defaultApiBaseUrl)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  This URL is currently active (no custom URL set).
                </p>
              </AlertDescription>
            </Alert>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              This is the default API base URL for this provider. Set a custom
              URL above to override this default.
            </p>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
