import { z } from "zod";

export const sharedEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REFRESH_TOKEN: z.string().min(1, "GOOGLE_REFRESH_TOKEN is required"),
  GOOGLE_DRIVE_NDA_TEMPLATE_ID: z.string().min(1, "GOOGLE_DRIVE_NDA_TEMPLATE_ID is required"),
  GOOGLE_DRIVE_AGREEMENTS_FOLDER_ID: z.string().min(1, "GOOGLE_DRIVE_AGREEMENTS_FOLDER_ID is required"),

  NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required"),
  NOTION_PEOPLE_DB_ID: z.string().min(1, "NOTION_PEOPLE_DB_ID is required"),
  NOTION_ROLES_DB_ID: z.string().min(1, "NOTION_ROLES_DB_ID is required"),

  DIGISIGNER_API_KEY: z.string().min(1, "DIGISIGNER_API_KEY is required"),
});
