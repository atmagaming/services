import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { uploadToDrive } from "$lib/server/google-drive";
import { invalidateCache } from "$lib/server/data";

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople)
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  if (!file) return new Response(JSON.stringify({ message: "file is required" }), { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = await uploadToDrive(file.name, file.type || "application/octet-stream", buffer);

  const document = await prisma.personDocument.create({
    data: { personId: params.id, name: name ?? file.name, url: driveFileId },
  });

  invalidateCache("people");

  return new Response(JSON.stringify({ document }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
