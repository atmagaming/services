import { handler } from "api/utils";
import { superAdminEmails } from "env";
import { createError } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

// Remove all permissions of a user. We don't delete the user because it can contain data for their authorization
export default handler(
  {
    body: {
      email: z.string(),
    },
  },
  async ({ user, body: { email } }) => {
    if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (!superAdminEmails.includes(user.email))
      throw createError({ statusCode: 403, statusMessage: "Only super-admin can remove permissions" });

    if (superAdminEmails.includes(email))
      throw createError({ statusCode: 400, statusMessage: "Cannot remove super-admin permissions" });

    await prisma.user.update({
      where: { email },
      data: {
        canViewTransactions: false,
        canViewRevenueShares: false,
        canViewPersonalData: false,
        canEditPeople: false,
      },
    });
  },
);
