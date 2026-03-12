import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { Hono } from "hono";
import { Resend } from "resend";
import { buildSessionUser, createJWT, getUser } from "../auth";
import { getCachedPeople } from "../repositories/people";
import { apiEnv, superAdminEmails } from "../env";
import { prisma } from "../prisma";

const auth = new Hono();

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();

  if (!email || !password) return c.json({ message: "Email and password are required" }, 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return c.json({ message: "Invalid email or password" }, 401);

  const valid = await compare(password, user.passwordHash);
  if (!valid) return c.json({ message: "Invalid email or password" }, 401);

  let personId: string | null = null;
  try {
    const people = await getCachedPeople();
    personId = people.find((p) => p.email === email)?.id ?? null;
  } catch (e) {
    console.error("Failed to resolve personId:", e);
  }

  const sessionUser = buildSessionUser(user, personId);
  const token = createJWT(sessionUser);

  return c.json({ token, user: sessionUser });
});

auth.post("/register", async (c) => {
  const { email, password, name } = await c.req.json<{ email?: string; password?: string; name?: string }>();

  if (!email || !password) return c.json({ message: "Email and password are required" }, 400);
  if (password.length < 8) return c.json({ message: "Password must be at least 8 characters" }, 400);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ message: "Email already registered" }, 409);

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash } });

  return c.json({ success: true });
});

auth.post("/logout", (c) => c.json({ success: true }));

auth.post("/forgot-password", async (c) => {
  const { email } = await c.req.json<{ email?: string }>();
  if (!email) return c.json({ message: "Email is required" }, 400);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    const resetUrl = `${apiEnv.PUBLIC_AUTH_URL}/reset-password?token=${token}`;

    try {
      const resend = new Resend(apiEnv.RESEND_API_KEY);
      await resend.emails.send({
        from: apiEnv.RESEND_FROM_EMAIL,
        to: email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }
  }

  return c.json({ success: true });
});

auth.post("/reset-password", async (c) => {
  const { token, password } = await c.req.json<{ token?: string; password?: string }>();

  if (!token || !password) return c.json({ message: "Token and password are required" }, 400);
  if (password.length < 8) return c.json({ message: "Password must be at least 8 characters" }, 400);

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date())
    return c.json({ message: "Invalid or expired token" }, 400);

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return c.json({ success: true });
});

export default auth;
