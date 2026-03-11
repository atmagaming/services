import { invalidateCache } from "$lib/server/data";
import { enqueueNotionSync } from "$lib/server/notion-queue";
import { prisma } from "$lib/server/prisma";
import { type PersonStatus, VALID_STATUSES } from "$lib/types";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const body = (await request.json()) as { status?: string; date?: string };
  const { status, date } = body;

  if (!status || !(VALID_STATUSES as string[]).includes(status)) {
    return new Response(JSON.stringify({ message: "Invalid status" }), { status: 400 });
  }

  const statusDate = date ?? new Date().toISOString().slice(0, 10);

  await prisma.personStatusChange.create({
    data: { personId: params.id, status, date: statusDate },
  });

  invalidateCache("people");

  if (status === "working") enqueueNotionSync(params.id, status as PersonStatus);

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
