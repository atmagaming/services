import { handler } from "api/utils";
import { superAdminEmails } from "env";
import { createError } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

// Change permissions of a user
export default handler(
  {
    body: {
      email: z.string(),
      permission: z.enum(["canViewTransactions", "canViewRevenueShares", "canViewPersonalData", "canEditPeople"]),
      value: z.boolean(),
    },
  },
  async ({ user, body: { email, permission, value } }) => {
    if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (!superAdminEmails.includes(user.email))
      throw createError({ statusCode: 403, statusMessage: "Only super-admin can manage permissions" });

    await prisma.user.upsert({
      where: { email },
      update: { [permission]: value },
      create: { email, [permission]: value },
    });
  },
);
