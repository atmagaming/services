import { z } from "zod";

const envSchema = z
  .object({
    // Shared
    TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),

    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    GOOGLE_REFRESH_TOKEN: z.string().min(1, "GOOGLE_REFRESH_TOKEN is required"),
    GOOGLE_DRIVE_NDA_TEMPLATE_ID: z.string().min(1, "GOOGLE_DRIVE_NDA_TEMPLATE_ID is required"),

    NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required"),
    NOTION_PEOPLE_DB_ID: z.string().min(1, "NOTION_PEOPLE_DB_ID is required"),
    NOTION_ROLES_DB_ID: z.string().min(1, "NOTION_ROLES_DB_ID is required"),

    DIGISIGNER_API_KEY: z.string().min(1, "DIGISIGNER_API_KEY is required"),

    // Bot
    ALLOWED_USER_ID: z.coerce.number(),
    SECONDARY_USER_ID: z.coerce.number().optional(),
    GROUP_CHAT_ID: z.coerce.number(),

    BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
    BASE_URL: z.string(),

    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    MESHY_API_KEY: z.string().min(1, "MESHY_API_KEY is required"),
    PERPLEXITY_API_KEY: z.string().min(1, "PERPLEXITY_API_KEY is required"),

    NOTION_MEMORIES_PAGE_ID: z.string().min(1, "NOTION_MEMORIES_PAGE_ID is required"),
    NOTION_SENSITIVE_DATA_DB_ID: z.string().min(1, "NOTION_SENSITIVE_DATA_DB_ID is required"),
    NOTION_TASKS_DB_ID: z.string().min(1, "NOTION_TASKS_DB_ID is required"),
    NOTION_HYPOCRISY_DB_ID: z.string().min(1, "NOTION_HYPOCRISY_DB_ID is required"),
    NOTION_SKILLS_DB_ID: z.string().min(1, "NOTION_SKILLS_DB_ID is required"),
    NOTION_SYSTEM_PROMPT_PAGE_ID: z.string().min(1, "NOTION_SYSTEM_PROMPT_PAGE_ID is required"),

    TELEGRAM_API_ID: z.coerce.number(),
    TELEGRAM_API_HASH: z.string().min(1, "TELEGRAM_API_HASH is required"),
    TELEGRAM_SESSION: z.string().min(1, "TELEGRAM_SESSION is required"),
    TELEGRAM_SESSION_LOCAL: z.string().optional(),
    TELEGRAM_PHONE_NUMBER: z.string().min(1, "TELEGRAM_PHONE_NUMBER is required"),
    TELEGRAM_TEAM_GROUP_ID: z.coerce.number(),
    TELEGRAM_TEAM_INVITE_LINK: z.string().min(1, "TELEGRAM_TEAM_INVITE_LINK is required"),

    WISE_API_TOKEN: z.string().min(1, "WISE_API_TOKEN is required"),

    NOTION_WEBHOOK_SECRET: z.string().optional(),

    DB_PATH: z.string().optional(),

    VERBOSE: z.number().default(0),

    // API
    SESSION_SECRET: z.string(),
    SUPER_ADMIN_EMAILS: z.string(),

    TURSO_DATABASE_URL: z.string(),
    TURSO_AUTH_TOKEN: z.string(),

    GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID: z.string(),
    GOOGLE_DRIVE_PERSONAL_FOLDERS_PARENT_ID: z.string(),

    SIGNING_ADMIN_NAME: z.string(),
    SIGNING_ADMIN_EMAIL: z.string(),

    RESEND_API_KEY: z.string(),
    RESEND_FROM_EMAIL: z.string(),

    TELEGRAM_ADMIN_USER_ID: z.string(),

    PUBLIC_AUTH_URL: z.string(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string(),
  })
  .refine((data) => data.BOT_MODE !== "webhook" || data.BASE_URL, {
    message: "WEBHOOK_URL is required when BOT_MODE is 'webhook'",
    path: ["WEBHOOK_URL"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const superAdminEmails = env.SUPER_ADMIN_EMAILS.split(",")
  .map((e) => e.trim())
  .filter(Boolean);
