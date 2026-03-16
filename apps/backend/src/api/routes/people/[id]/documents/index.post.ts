import { handler } from "api/utils";
import { env } from "env";
import { createError, readMultipartFormData } from "h3";
import { requirePermission } from "services/auth";
import { google } from "services/google-api";
import { DocumentCategory, prisma } from "services/prisma";

function isValidCategory(category: string): category is DocumentCategory {
  return Object.values(DocumentCategory).includes(category as DocumentCategory);
}

// Upload document
export default handler(async ({ user, event, router: { id: personId } }) => {
  requirePermission(user, "canEditPeople");

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((p) => p.name === "file");
  if (!filePart) throw createError({ statusCode: 400, statusMessage: "file is required" });

  const namePart = parts?.find((p) => p.name === "name");
  const categoryPart = parts?.find((p) => p.name === "category");
  const name = namePart ? Buffer.from(namePart.data).toString() : null;
  const category = categoryPart ? Buffer.from(categoryPart.data).toString() : "other";
  if (!isValidCategory(category)) throw createError({ statusCode: 400, statusMessage: "Invalid category" });

  const filename = filePart.filename ?? name ?? "upload";

  const { id: url } = await google.drive.upload(
    filename,
    filePart.data,
    filePart.type ?? "application/octet-stream",
    env.GOOGLE_DRIVE_DOCUMENTS_FOLDER,
  );

  const document = await prisma.personDocument.create({
    data: { personId, name: name ?? filename, url, category },
  });

  return { id: document.id, name: document.name, url, category: document.category };
});
