import { handler } from "api/utils";
import { hash } from "bcryptjs";
import { createError } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      email: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().nullable(),
    },
  },
  async ({ body: { email, password, name } }) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw createError({ statusCode: 409, statusMessage: "Email already registered" });

    const passwordHash = await hash(password, 12);
    await prisma.user.create({ data: { email, name, passwordHash } });
  },
);
