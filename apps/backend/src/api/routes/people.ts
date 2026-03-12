import { Hono } from "hono";
import type { PersonStatus } from "@atma/types";
import { VALID_STATUSES } from "@atma/types";
import { getUser } from "../auth";
import { countMondaysInMonth } from "../calculations";
import { invalidateCache } from "../cache";
import { getCachedPeople, isPersonActive, mapPersonRecord } from "../repositories/people";
import { apiEnv } from "../env";
import { getDriveFileStream, uploadToDrive } from "../services/google-drive";
import { enqueueNotionSync } from "../services/notion-sync-queue";
import { createPersonNotionPage, setPersonNotionIcon, updatePersonNotion, uploadImageToNotion } from "../services/notion";
import { prisma } from "../prisma";
import { notifySigningRequest } from "../services/notifications";
import { sendDocumentForSigning } from "../services/signing";

const people = new Hono();

people.get("/config", (c) => {
  const ndaId = apiEnv.GOOGLE_DRIVE_NDA_TEMPLATE_ID;
  const contractId = apiEnv.GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID;
  return c.json({
    ndaTemplateUrl: ndaId ? `https://docs.google.com/document/d/${ndaId}/edit` : "",
    contractTemplateUrl: contractId ? `https://docs.google.com/document/d/${contractId}/edit` : "",
  });
});

people.get("/", async (c) => {
  const user = getUser(c);
  const canViewPersonalData = user?.canViewPersonalData ?? false;
  const all = await getCachedPeople();

  if (canViewPersonalData) return c.json({ people: all });

  const activePeople = all.filter(isPersonActive).map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    roles: p.roles,
    statusChanges: p.statusChanges,
  }));

  return c.json({ people: activePeople });
});

people.post("/", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json();

  if (!body.name) return c.json({ message: "name is required" }, 400);

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
      notionPersonPageId: await createPersonNotionPage(body.name, body.image).catch((e: Error) => {
        console.error(`Failed to create Notion page for ${body.name}: ${e.message}`);
        return "";
      }),
      telegramAccount: body.telegram ?? "",
      discord: body.discord ?? "",
      linkedin: body.linkedin ?? "",
      description: body.description ?? "",
      statusChanges: { create: { date: new Date().toISOString().slice(0, 10), status: "inactive" } },
      roles: body.roles?.length
        ? { create: body.roles.map(({ notionId, name }: { notionId: string; name: string }) => ({ notionId, name })) }
        : undefined,
    },
    include: { statusChanges: true, documents: true, roles: true },
  });

  invalidateCache("people");
  return c.json({ person }, 201);
});

people.patch("/:id", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const id = c.req.param("id");
  const body = await c.req.json();

  const stringFields = ["name", "firstName", "lastName", "image", "weeklySchedule", "email", "discord", "linkedin", "description"];
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
    const identification = body.identification;
    if ("type" in identification) data.identification = identification.type;
    if ("number" in identification) data.passportNumber = identification.number;
    if ("issueDate" in identification) data.passportIssueDate = identification.issueDate;
    if ("issuingAuthority" in identification) data.passportIssuingAuthority = identification.issuingAuthority;
  }

  if ("roles" in body && Array.isArray(body.roles)) {
    await prisma.personRole.deleteMany({ where: { personId: id } });
    const uniqueRoles = [
      ...new Map((body.roles as { notionId: string; name: string }[]).map((r) => [r.notionId, r])).values(),
    ];
    data.roles = { create: uniqueRoles.map(({ notionId, name }) => ({ notionId, name })) };
  }

  const person = await prisma.person.update({
    where: { id },
    data,
    include: { statusChanges: true, documents: true, roles: true },
  });

  invalidateCache("people");

  if (!person.notionPersonPageId) {
    const notionId = await createPersonNotionPage(person.name, person.image ?? undefined).catch((e: Error) => {
      console.error(`Failed to create Notion page for ${person.name}: ${e.message}`);
      return null;
    });
    if (notionId) {
      await prisma.person.update({ where: { id }, data: { notionPersonPageId: notionId } });
      person.notionPersonPageId = notionId;
      invalidateCache("people");
    }
  }

  if (person.notionPersonPageId)
    updatePersonNotion(person.notionPersonPageId, {
      name: person.name,
      roleNotionIds: person.roles.map((r) => r.notionId),
    }).catch((e: Error) => console.error(`Failed to sync Notion: ${e.message}`));

  const now = new Date();
  const mondays = countMondaysInMonth(now.getFullYear(), now.getMonth());

  return c.json({ person: mapPersonRecord(person, mondays) });
});

people.delete("/:id", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  await prisma.person.delete({ where: { id: c.req.param("id") } });
  invalidateCache("people");
  return c.json({ success: true });
});

// Documents
people.post("/:id/documents", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const category = (formData.get("category") as string | null) ?? "other";

  if (!file) return c.json({ message: "file is required" }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = await uploadToDrive(file.name, file.type || "application/octet-stream", buffer);

  const document = await prisma.personDocument.create({
    data: { personId: c.req.param("id"), name: name ?? file.name, url: driveFileId, category },
  });

  invalidateCache("people");
  return c.json({ document }, 201);
});

people.delete("/:id/documents/:docId", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  await prisma.personDocument.delete({ where: { id: c.req.param("docId") } });
  invalidateCache("people");
  return c.json({ success: true });
});

// Image
people.post("/:id/image", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ message: "file is required" }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = await uploadToDrive(file.name, file.type || "image/jpeg", buffer);
  const image = `/images/${driveFileId}`;

  const person = await prisma.person.update({ where: { id: c.req.param("id") }, data: { image } });

  const { notionPersonPageId } = person;
  if (notionPersonPageId)
    uploadImageToNotion(file.name, file.type || "image/jpeg", buffer)
      .then((fileUploadId) => setPersonNotionIcon(notionPersonPageId, fileUploadId))
      .catch((e: Error) => console.error(`Failed to update Notion icon: ${e.message}`));

  invalidateCache("people");
  return c.json({ image });
});

// Sign
people.post("/:id/sign", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json<{ category?: string }>();
  if (body.category !== "nda" && body.category !== "contract")
    return c.json({ message: "category must be nda or contract" }, 400);

  const id = c.req.param("id");
  const people = await getCachedPeople();
  const person = people.find((p) => p.id === id);
  if (!person) return c.json({ message: "Person not found" }, 404);

  try {
    const { requestId, adminUrl, personUrl } = await sendDocumentForSigning(person, body.category);

    await prisma.signingRequest.create({
      data: { personId: id, category: body.category, requestId, adminUrl, personUrl },
    });

    const fullName = `${person.firstName} ${person.lastName}`.trim() || person.name;
    await notifySigningRequest({
      fullName,
      email: person.email,
      role: person.roles[0]?.name ?? "—",
      category: body.category.toUpperCase(),
      adminUrl,
      personUrl,
    });

    return c.json({ adminUrl, personUrl });
  } catch (e) {
    return c.json({ message: `Signing failed: ${(e as Error).message}` }, 500);
  }
});

// Status
people.post("/:id/status", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json<{ status?: string; date?: string }>();
  if (!body.status || !(VALID_STATUSES as string[]).includes(body.status))
    return c.json({ message: "Invalid status" }, 400);

  const statusDate = body.date ?? new Date().toISOString().slice(0, 10);
  await prisma.personStatusChange.create({ data: { personId: c.req.param("id"), status: body.status, date: statusDate } });

  invalidateCache("people");
  if (body.status === "working") enqueueNotionSync(c.req.param("id"), body.status);

  return c.json({ success: true });
});

people.patch("/:id/status/:statusId", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json<{ status?: string; date?: string }>();
  const data: { status?: string; date?: string } = {};

  if (body.status !== undefined) {
    if (!(VALID_STATUSES as string[]).includes(body.status)) return c.json({ message: "Invalid status" }, 400);
    data.status = body.status;
  }
  if (body.date !== undefined) data.date = body.date;

  const updated = await prisma.personStatusChange.update({ where: { id: c.req.param("statusId") }, data });

  invalidateCache("people");
  if (updated.status === "working") enqueueNotionSync(updated.personId, updated.status);

  return c.json({ success: true });
});

people.delete("/:id/status/:statusId", async (c) => {
  const user = getUser(c);
  if (!user?.canEditPeople) return c.json({ message: "Forbidden" }, 403);

  await prisma.personStatusChange.delete({ where: { id: c.req.param("statusId") } });
  invalidateCache("people");
  return c.json({ success: true });
});

export default people;
