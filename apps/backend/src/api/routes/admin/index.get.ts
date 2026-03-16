import { handler } from "api/utils";
import { createError } from "h3";
import { prisma } from "services/prisma";

export default handler(async ({ user }) => {
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (!user.isSuperAdmin) throw createError({ statusCode: 403, statusMessage: "Forbidden" });

  return await prisma.user.findMany({
    omit: {
      passwordHash: true,
    },
  });
});
