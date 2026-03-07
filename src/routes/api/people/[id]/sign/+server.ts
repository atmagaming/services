import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { sendDocumentForSigning } from "$lib/server/signer";

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople)
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  const body = (await request.json()) as { category?: string };
  if (body.category !== "nda" && body.category !== "contract")
    return new Response(JSON.stringify({ message: "category must be nda or contract" }), { status: 400 });

  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: { statusChanges: true, documents: true, roles: true },
  });
  if (!person) return new Response(JSON.stringify({ message: "Person not found" }), { status: 404 });

  // Map Prisma person to Person type
  const p = {
    id: person.id,
    name: person.name,
    firstName: person.firstName,
    lastName: person.lastName,
    nickname: person.nickname,
    image: person.image,
    email: person.email,
    passportNumber: person.passportNumber,
    passportIssueDate: person.passportIssueDate,
    passportIssuingAuthority: person.passportIssuingAuthority,
    telegramAccount: person.telegramAccount,
    discord: person.discord,
    linkedin: person.linkedin,
    weeklySchedule: person.weeklySchedule,
    hourlyRatePaid: person.hourlyRatePaid,
    hourlyRateAccrued: person.hourlyRateAccrued,
    identification: person.identification,
    notionPersonPageId: person.notionPersonPageId,
    description: person.description,
    statusChanges: person.statusChanges,
    documents: person.documents.map((d) => ({ ...d, category: d.category as "nda" | "contract" | "other" })),
    roles: person.roles.map((r) => ({ notionId: r.notionId, name: r.name })),
  };

  try {
    const signUrl = await sendDocumentForSigning(p, body.category);
    return new Response(JSON.stringify({ signUrl }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ message: "Signing failed: " + (e as Error).message }), { status: 500 });
  }
};
