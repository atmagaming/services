import { getCachedPeople, invalidateCache, isPersonActive } from "$lib/server/data";
import { createPersonNotionPage } from "$lib/server/notion";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const canViewPersonalData = locals.user?.canViewPersonalData ?? false;

  const people = await getCachedPeople();

  if (canViewPersonalData) {
    return new Response(JSON.stringify({ people }), { headers: { "content-type": "application/json" } });
  }

  const activePeople = people.filter(isPersonActive).map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    roles: p.roles,
    statusChanges: p.statusChanges,
  }));

  return new Response(JSON.stringify({ people: activePeople }), { headers: { "content-type": "application/json" } });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    identification?: { type?: string; number?: string; issueDate?: string; issuingAuthority?: string };
    weeklySchedule?: string;
    hourlyRatePaid?: number;
    hourlyRateAccrued?: number;
    email?: string;
    telegram?: string;
    discord?: string;
    linkedin?: string;
    description?: string;
    roles?: { notionId: string; name: string }[];
  };

  if (!body.name) {
    return new Response(JSON.stringify({ message: "name is required" }), { status: 400 });
  }

  const person = await prisma.person.create({
    data: {
      name: body.name,
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      image: body.image ?? "",
      identification: body.identification?.type ?? "",
      passportNumber: body.identification?.number ?? "",
      passportIssueDate: body.identification?.issueDate ?? "",
      passportIssuingAuthority: body.identification?.issuingAuthority ?? "",
      weeklySchedule: body.weeklySchedule ?? "4,4,4,4,4,0,0",
      hourlyRatePaid: body.hourlyRatePaid ?? 0,
      hourlyRateAccrued: body.hourlyRateAccrued ?? 0,
      email: body.email ?? "",
      notionPersonPageId: await createPersonNotionPage(body.name, body.image).catch(() => ""),
      telegramAccount: body.telegram ?? "",
      discord: body.discord ?? "",
      linkedin: body.linkedin ?? "",
      description: body.description ?? "",
      statusChanges: {
        create: { date: new Date().toISOString().slice(0, 10), status: "inactive" },
      },
      roles: body.roles?.length ? { create: body.roles.map(({ notionId, name }) => ({ notionId, name })) } : undefined,
    },
    include: { statusChanges: true, documents: true, roles: true },
  });

  invalidateCache("people");

  return new Response(JSON.stringify({ person }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
