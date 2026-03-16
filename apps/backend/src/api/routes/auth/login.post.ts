import { handler } from "api/utils";
import { compare } from "bcryptjs";
import { createError } from "h3";
import { createJWT } from "services/auth";
import { prisma } from "services/prisma";
import { z } from "zod";

export default handler({ body: { email: z.string(), password: z.string() } }, async ({ body: { email, password } }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });

  const valid = await compare(password, user.passwordHash);
  if (!valid) throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });

  return createJWT(user);
});
