import { env } from "$env/dynamic/private";

export const superAdminEmails = (env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
