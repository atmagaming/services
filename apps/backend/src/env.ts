import { z } from "zod";
import { sharedEnvSchema } from "./shared-env";

const envSchema = sharedEnvSchema
  .extend({
    ALLOWED_USER_ID: z.coerce.number(),
    SECONDARY_USER_ID: z.coerce.number().optional(),
    GROUP_CHAT_ID: z.coerce.number(),

    BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
    PORT: z.coerce.number(),
    BASE_URL: z.string(),

    // Required API keys
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    MESHY_API_KEY: z.string().min(1, "MESHY_API_KEY is required"),
    PERPLEXITY_API_KEY: z.string().min(1, "PERPLEXITY_API_KEY is required"),

    // Notion Integration (bot-specific)
    NOTION_MEMORIES_PAGE_ID: z.string().min(1, "NOTION_MEMORIES_PAGE_ID is required"),
    NOTION_SENSITIVE_DATA_DB_ID: z.string().min(1, "NOTION_SENSITIVE_DATA_DB_ID is required"),
    NOTION_TASKS_DB_ID: z.string().min(1, "NOTION_TASKS_DB_ID is required"),
    NOTION_HYPOCRISY_DB_ID: z.string().min(1, "NOTION_HYPOCRISY_DB_ID is required"),
    NOTION_SKILLS_DB_ID: z.string().min(1, "NOTION_SKILLS_DB_ID is required"),
    NOTION_SYSTEM_PROMPT_PAGE_ID: z.string().min(1, "NOTION_SYSTEM_PROMPT_PAGE_ID is required"),

    // Telegram User Client (GramJS)
    TELEGRAM_API_ID: z.coerce.number(),
    TELEGRAM_API_HASH: z.string().min(1, "TELEGRAM_API_HASH is required"),
    TELEGRAM_SESSION: z.string().min(1, "TELEGRAM_SESSION is required"),
    TELEGRAM_SESSION_LOCAL: z.string().optional(),
    TELEGRAM_PHONE_NUMBER: z.string().min(1, "TELEGRAM_PHONE_NUMBER is required"),
    TELEGRAM_TEAM_GROUP_ID: z.coerce.number(),
    TELEGRAM_TEAM_INVITE_LINK: z.string().min(1, "TELEGRAM_TEAM_INVITE_LINK is required"),

    // Wise
    WISE_API_TOKEN: z.string().min(1, "WISE_API_TOKEN is required"),

    // Notion Webhook
    NOTION_WEBHOOK_SECRET: z.string().optional(),

    // Database
    DB_PATH: z.string().optional(),

    VERBOSE: z.number().default(0),
  })
  .refine((data) => data.BOT_MODE !== "webhook" || data.BASE_URL, {
    message: "WEBHOOK_URL is required when BOT_MODE is 'webhook'",
    path: ["WEBHOOK_URL"],
  });

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
