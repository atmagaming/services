import { TELEGRAM_ADMIN_USER_ID, TELEGRAM_BOT_TOKEN } from "$env/static/private";
import { prisma } from "$lib/server/prisma";
import { sendDocumentForSigning } from "$lib/server/signer";
import { type IdType, Rates } from "$lib/types";
import type { RequestHandler } from "./$types";

async function sendTelegramMessage(text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_ADMIN_USER_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("Telegram notification failed:", await res.text());
}

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });

  const body = (await request.json()) as { category?: string };
  if (body.category !== "nda" && body.category !== "contract")
    return new Response(JSON.stringify({ message: "category must be nda or contract" }), { status: 400 });

  const record = await prisma.person.findUnique({
    where: { id: params.id },
    include: { statusChanges: true, documents: true, roles: true },
  });
  if (!record) return new Response(JSON.stringify({ message: "Person not found" }), { status: 404 });

  const sorted = record.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  const workingChange = sorted.find((c) => c.status === "working");
  const inactiveChange = sorted.findLast((c) => c.status === "inactive");
  const latest = sorted.at(-1);
  const active = latest !== undefined && ["working", "vacation", "sick_leave"].includes(latest.status);

  const schedule = record.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
  const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);
  const hourlyRate = new Rates(record.hourlyRatePaid, record.hourlyRateAccrued);

  const person = {
    id: record.id,
    name: record.name,
    firstName: record.firstName ?? "",
    lastName: record.lastName ?? "",
    image: record.image ?? "",
    identification: {
      type: (record.identification as IdType) || ("" as IdType | ""),
      number: record.passportNumber ?? "",
      issueDate: record.passportIssueDate ?? "",
      issuingAuthority: record.passportIssuingAuthority ?? "",
    },
    weeklySchedule: record.weeklySchedule,
    schedule,
    hoursPerWeek,
    hourlyRate,
    monthlyPaid: 0,
    monthlyAccrued: 0,
    monthlyTotal: 0,
    startDate: workingChange?.date ?? null,
    endDate: inactiveChange?.date ?? null,
    status: active ? "Active" : "Inactive",
    email: record.email,
    notionPersonPageId: record.notionPersonPageId,
    telegram: record.telegramAccount ?? "",
    discord: record.discord ?? "",
    linkedin: record.linkedin ?? "",
    description: record.description ?? "",
    statusChanges: record.statusChanges.map((sc) => ({ id: sc.id, date: sc.date, status: sc.status })),
    documents: record.documents.map((d) => ({ ...d, category: d.category as "nda" | "contract" | "other" })),
    roles: record.roles.map((r) => ({ notionId: r.notionId, name: r.name })),
  };

  try {
    const { requestId, adminUrl, personUrl } = await sendDocumentForSigning(person, body.category);

    await prisma.signingRequest.create({
      data: { personId: params.id, category: body.category, requestId, adminUrl, personUrl },
    });

    const fullName = `${record.firstName} ${record.lastName}`.trim() || record.name;
    const role = record.roles.map((r) => r.name)[0] ?? "—";
    const category = body.category.toUpperCase();

    await sendTelegramMessage(
      `📄 <b>${category} signing request sent</b>\n\n` +
        `<b>Person:</b> ${fullName}\n` +
        `<b>Email:</b> ${record.email}\n` +
        `<b>Role:</b> ${role}\n\n` +
        `<b>My signing link:</b>\n<a href="${adminUrl}">${adminUrl}</a>\n\n` +
        `<b>Their signing link:</b>\n<a href="${personUrl}">${personUrl}</a>`,
    );

    return new Response(JSON.stringify({ adminUrl, personUrl }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ message: "Signing failed: " + (e as Error).message }), { status: 500 });
  }
};
