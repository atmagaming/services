import { countMondaysInMonth, invalidateCache, mapPersonRecord } from "$lib/server/data";
import { createPersonNotionPage, updatePersonNotion } from "$lib/server/notion";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const stringFields = [
    "name",
    "firstName",
    "lastName",
    "image",
    "weeklySchedule",
    "email",
    "discord",
    "linkedin",
    "description",
  ];
  const floatFields = ["hourlyRatePaid", "hourlyRateAccrued"];

  const data: Record<string, unknown> = {};
  for (const key of stringFields) {
    if (key in body) data[key] = body[key];
  }
  for (const key of floatFields) {
    if (key in body) data[key] = parseFloat(String(body[key]));
  }

  if ("telegram" in body) data.telegramAccount = body.telegram;

  if ("identification" in body && body.identification && typeof body.identification === "object") {
    const id = body.identification as Record<string, unknown>;
    if ("type" in id) data.identification = id.type;
    if ("number" in id) data.passportNumber = id.number;
    if ("issueDate" in id) data.passportIssueDate = id.issueDate;
    if ("issuingAuthority" in id) data.passportIssuingAuthority = id.issuingAuthority;
  }

  if ("roles" in body && Array.isArray(body.roles)) {
    await prisma.personRole.deleteMany({ where: { personId: params.id } });
    data.roles = {
      create: (body.roles as { notionId: string; name: string }[]).map(({ notionId, name }) => ({ notionId, name })),
    };
  }

  const person = await prisma.person.update({
    where: { id: params.id },
    data,
    include: { statusChanges: true, documents: true, roles: true },
  });

  invalidateCache("people");

  // If person has no Notion page yet, create one now
  if (!person.notionPersonPageId) {
    const notionId = await createPersonNotionPage(person.name, person.image ?? undefined).catch((e) => {
      console.error(`Failed to create Notion page for ${person.name}: ${e.message}`);
      return null;
    });
    if (notionId) {
      await prisma.person.update({ where: { id: params.id }, data: { notionPersonPageId: notionId } });
      person.notionPersonPageId = notionId;
      invalidateCache("people");
    }
  }

  if (person.notionPersonPageId)
    updatePersonNotion(person.notionPersonPageId, {
      name: person.name,
      roleNotionIds: person.roles.map((r) => r.notionId),
    }).catch((e) => console.error(`Failed to sync Notion: ${e.message}`));

  const now = new Date();
  const mondays = countMondaysInMonth(now.getFullYear(), now.getMonth());

  return new Response(JSON.stringify({ person: mapPersonRecord(person, mondays) }), {
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  await prisma.person.delete({ where: { id: params.id } });

  invalidateCache("people");

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
