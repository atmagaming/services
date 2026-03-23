import { handler } from "api/utils";
import { createError, readMultipartFormData } from "h3";
import { requirePermission } from "services/auth";
import { env } from "env";
import { notion } from "services/notion";
import { ensurePersonalFolder } from "services/people";
import { prisma } from "services/prisma";

// Upload new person's image
export default handler(async ({ user, event, router: { id } }) => {
  requirePermission(user, "canEditPeople");

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((p) => p.name === "file");
  if (!filePart) throw createError({ statusCode: 400, statusMessage: "file is required" });

  const folder = await ensurePersonalFolder(id);

  const driveFileId = (await folder.upload(filePart.filename ?? "upload", filePart.data, filePart.type ?? "image/jpeg"))
    .id;

  await Promise.all([
    prisma.person.update({ where: { id }, data: { image: driveFileId } }),
    notion.people.update({ where: { id }, data: {}, $icon: filePart.data }),
  ]);
});
