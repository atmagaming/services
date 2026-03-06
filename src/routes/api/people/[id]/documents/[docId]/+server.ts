import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { invalidateCache } from "$lib/server/data";

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.canEditPeople)
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  await prisma.personDocument.delete({ where: { id: params.docId } });

  invalidateCache("people");

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
