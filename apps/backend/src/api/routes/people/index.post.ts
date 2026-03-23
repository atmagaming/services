import { handler } from "api/utils";
import { createError } from "h3";
import { notion } from "services/notion";
import { ensurePersonalFolder } from "services/people";
import { prisma } from "services/prisma";
import { z } from "zod";

export default handler({ body: { name: z.string() } }, async ({ user, body: { name } }) => {
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });
  if (!user.canEditPeople) throw createError({ statusCode: 403, message: "Forbidden" });

  const { id } = await notion.people.create({ data: { name } });
  await prisma.person.create({ data: { id, name } });

  // Create personal Drive folder (non-blocking — don't fail person creation if this errors)
  ensurePersonalFolder(id).catch((e: Error) =>
    console.error(`Failed to create Drive folder for person ${id}: ${e.message}`),
  );

  return id;
});
