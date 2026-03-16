import { randomBytes } from "node:crypto";
import { handler } from "api/utils";
import { env } from "env";
import { Resend } from "resend";
import { prisma } from "services/prisma";
import { z } from "zod";

const resend = new Resend(env.RESEND_API_KEY);

export default handler({ body: { email: z.string() } }, async ({ body: { email } }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    const resetUrl = `${env.PUBLIC_AUTH_URL}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }
  }

  return { success: true };
});
