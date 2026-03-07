import { invalidateCache } from "$lib/server/data";
import { uploadToDrive } from "$lib/server/google-drive";
import { setPersonNotionIcon, uploadImageToNotion } from "$lib/server/notion";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return new Response(JSON.stringify({ message: "file is required" }), { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = await uploadToDrive(file.name, file.type || "image/jpeg", buffer);
  const image = `/api/images/${driveFileId}`;

  const person = await prisma.person.update({ where: { id: params.id }, data: { image } });

  // Upload image to Notion and set as page icon (best-effort)
  if (person.notionPersonPageId)
    uploadImageToNotion(file.name, file.type || "image/jpeg", buffer)
      .then((fileUploadId) => setPersonNotionIcon(person.notionPersonPageId!, fileUploadId))
      .catch((e) => console.error("Failed to update Notion icon: " + e.message));

  invalidateCache("people");
  return new Response(JSON.stringify({ image }), { headers: { "content-type": "application/json" } });
};
