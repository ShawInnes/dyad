import { registerOllamaHandlers } from "./local_model_ollama_handler";
import { registerLMStudioHandlers } from "./local_model_lmstudio_handler";
import { registerLiteLLMHandlers } from "./local_model_litellm_handler";

export function registerLocalModelHandlers() {
  console.log("Registering local model handlers..."); // Add this
  registerOllamaHandlers();
  registerLMStudioHandlers();
  registerLiteLLMHandlers();
  console.log("Local model handlers registered"); // Add this
}
