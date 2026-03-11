import { invalidateCache } from "$lib/server/data";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.canEditPeople) return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  await prisma.personDocument.delete({ where: { id: params.docId } });

  invalidateCache("people");

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
