import { z } from "zod";

const apiEnvSchema = z.object({
  // Auth
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  SUPER_ADMIN_EMAILS: z.string().default(""),

  // Database
  TURSO_DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  TURSO_AUTH_TOKEN: z.string().optional(),

  // Google
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_DRIVE_DOCUMENTS_FOLDER: z.string().default(""),
  GOOGLE_DRIVE_NDA_TEMPLATE_ID: z.string().default(""),
  GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID: z.string().default(""),
  GOOGLE_DRIVE_AGREEMENTS_FOLDER_ID: z.string().default(""),

  // Notion
  NOTION_API_KEY: z.string().min(1),
  NOTION_PEOPLE_DB_ID: z.string().min(1),
  NOTION_ROLES_DB_ID: z.string().min(1),

  // Signing
  DIGISIGNER_API_KEY: z.string().min(1),
  SIGNING_ADMIN_NAME: z.string().default(""),
  SIGNING_ADMIN_EMAIL: z.string().default(""),

  // Email
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("noreply@example.com"),

  // Telegram (for notifications)
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ADMIN_USER_ID: z.string().default(""),

  // Auth URL (for password reset links)
  PUBLIC_AUTH_URL: z.string().default("http://localhost:5173"),
});

const parsed = apiEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid API environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid API environment variables");
}

export const apiEnv = parsed.data;

export const superAdminEmails = apiEnv.SUPER_ADMIN_EMAILS.split(",")
  .map((e) => e.trim())
  .filter(Boolean);
