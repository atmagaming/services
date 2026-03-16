import { handler } from "api/utils";
import { hash } from "bcryptjs";
import { createError } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  { body: { token: z.string(), password: z.string().min(8, "Password must be at least 8 characters") } },
  async ({ body: { token, password } }) => {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date())
      throw createError({ statusCode: 400, statusMessage: "Invalid or expired token" });

    const passwordHash = await hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);
  },
);
