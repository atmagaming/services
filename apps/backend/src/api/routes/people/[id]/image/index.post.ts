import { handler } from "api/utils";
import { env } from "env";
import { createError, readMultipartFormData } from "h3";
import { requirePermission } from "services/auth";
import { google } from "services/google-api";
import { notion } from "services/notion";
import { prisma } from "services/prisma";

// Upload new person's image
export default handler(async ({ user, event, router: { id } }) => {
  requirePermission(user, "canEditPeople");

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((p) => p.name === "file");
  if (!filePart) throw createError({ statusCode: 400, statusMessage: "file is required" });

  const driveFileId = (
    await google.drive.upload(
      filePart.filename ?? "upload",
      filePart.data,
      filePart.type ?? "image/jpeg",
      env.GOOGLE_DRIVE_DOCUMENTS_FOLDER,
    )
  ).id;
  const image = `/images/${driveFileId}`;

  await Promise.all([
    prisma.person.update({ where: { id }, data: { image } }),
    notion.people.update({ where: { id }, data: {}, $icon: image }),
  ]);
});
