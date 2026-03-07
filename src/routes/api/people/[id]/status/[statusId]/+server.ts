import { invalidateCache } from "$lib/server/data";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  const body = (await request.json()) as { status?: string; date?: string };
  const validStatuses = ["working", "inactive", "vacation", "sick_leave"];

  const data: { status?: string; date?: string } = {};
  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status))
      return new Response(JSON.stringify({ message: "Invalid status" }), { status: 400 });
    data.status = body.status;
  }
  if (body.date !== undefined) data.date = body.date;

  await prisma.personStatusChange.update({ where: { id: params.statusId }, data });

  invalidateCache("people");
  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.canEditPeople) return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  await prisma.personStatusChange.delete({ where: { id: params.statusId } });

  invalidateCache("people");
  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
