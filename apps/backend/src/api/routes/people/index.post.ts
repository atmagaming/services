import { handler } from "api/utils";
import { createError } from "h3";
import { notion } from "services/notion";
import { prisma } from "services/prisma";
import { z } from "zod";

export default handler({ body: { name: z.string() } }, async ({ user, body: { name } }) => {
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });
  if (!user.canEditPeople) throw createError({ statusCode: 403, message: "Forbidden" });

  // First, get id from Notion
  const { id } = await notion.people.create({ data: { name } });

  // Write it to the prisma db
  await prisma.person.create({ data: { id, name } });

  return id;
});
