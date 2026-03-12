import type { DocumentCategory, IdType, Person, PersonStatus } from "@atma/types";
import { Rates } from "@atma/types";
import { countMondaysInMonth } from "../calculations";
import { cached } from "../cache";
import { prisma } from "../prisma";

type PersonRecord = Awaited<
  ReturnType<typeof prisma.person.findMany<{ include: { statusChanges: true; documents: true; roles: true } }>>
>[number];

export function mapPersonRecord(r: PersonRecord, mondays: number): Person {
  const rolesMap = new Map(r.roles.map((role) => [role.notionId, role]));
  const roles = [...rolesMap.values()].map(({ notionId, name }) => ({ notionId, name }));

  const schedule = r.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
  const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);

  const sorted = r.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  const workingChange = sorted.find((c) => c.status === "working");
  const inactiveChange = sorted.findLast((c) => c.status === "inactive");
  const latest = sorted.at(-1);
  const active = latest !== undefined && latest.status !== "inactive";

  const hourlyRate = new Rates(r.hourlyRatePaid, r.hourlyRateAccrued);
  const monthlyPaid = hoursPerWeek * hourlyRate.paid * mondays;
  const monthlyAccrued = hoursPerWeek * hourlyRate.accrued * mondays;

  return {
    id: r.id,
    name: r.name,
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    image: r.image ?? "",
    identification: {
      type: (r.identification as IdType) || "",
      number: r.passportNumber ?? "",
      issueDate: r.passportIssueDate ?? "",
      issuingAuthority: r.passportIssuingAuthority ?? "",
    },
    weeklySchedule: r.weeklySchedule,
    schedule,
    hoursPerWeek,
    hourlyRate,
    monthlyPaid,
    monthlyAccrued,
    monthlyTotal: monthlyPaid + monthlyAccrued,
    startDate: workingChange?.date ?? null,
    endDate: inactiveChange?.date ?? null,
    status: active ? "Active" : "Inactive",
    email: r.email,
    notionPersonPageId: r.notionPersonPageId,
    telegram: r.telegramAccount,
    discord: r.discord ?? "",
    linkedin: r.linkedin ?? "",
    description: r.description ?? "",
    statusChanges: r.statusChanges.map((sc) => ({ id: sc.id, date: sc.date, status: sc.status as PersonStatus })),
    documents: r.documents.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      category: d.category as DocumentCategory,
    })),
    roles,
  };
}

async function fetchPeople(): Promise<Person[]> {
  const records = await prisma.person.findMany({ include: { statusChanges: true, documents: true, roles: true } });
  const now = new Date();
  const mondays = countMondaysInMonth(now.getFullYear(), now.getMonth());
  return records.map((r) => mapPersonRecord(r, mondays));
}

export function isPersonActive(person: Person): boolean {
  return person.status === "Active";
}

export function getCachedPeople() {
  return cached("people", fetchPeople);
}
