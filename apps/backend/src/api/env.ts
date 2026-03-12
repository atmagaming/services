import { z } from "zod";
import { sharedEnvSchema } from "../shared-env";

const apiEnvSchema = sharedEnvSchema.extend({
  // Auth
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  SUPER_ADMIN_EMAILS: z.string().default(""),

  // Database
  TURSO_DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  TURSO_AUTH_TOKEN: z.string().optional(),

  // Google (API-specific)
  GOOGLE_DRIVE_DOCUMENTS_FOLDER: z.string().default(""),
  GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID: z.string().default(""),

  // Signing (API-specific)
  SIGNING_ADMIN_NAME: z.string().default(""),
  SIGNING_ADMIN_EMAIL: z.string().default(""),

  // Email
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("noreply@example.com"),

  // Telegram (for notifications)
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
