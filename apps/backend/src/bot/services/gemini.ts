import { env } from "env";
import { GeminiClient } from "../../services/gemini";

export const geminiClient = new GeminiClient(env.GEMINI_API_KEY);
