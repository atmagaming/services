import { fetchAllRoles } from "$lib/server/notion";
import { prisma } from "$lib/server/prisma";
import type { DocumentCategory, IdType, Person, Transaction, TransactionMethod } from "$lib/types";
import { Rates } from "$lib/types";

const CACHE_TTL = 300_000; // 5 minutes in ms

let notionRolesPromise: Promise<Map<string, string>> | null = null;

export function getNotionRoles(): Promise<Map<string, string>> {
  notionRolesPromise ??= fetchAllRoles()
    .then((roles) => new Map(roles.map((r) => [r.notionId, r.name])))
    .catch((e) => {
      console.error(`Failed to load Notion roles: ${(e as Error).message}`);
      return new Map<string, string>();
    });
  return notionRolesPromise;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export function countMondaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 1) count++;
  }
  return count;
}

const ACTIVE_STATUSES = new Set(["working", "vacation", "sick_leave"]);

type PersonRecord = Awaited<
  ReturnType<typeof prisma.person.findMany<{ include: { statusChanges: true; documents: true; roles: true } }>>
>[number];

export function mapPersonRecord(r: PersonRecord, mondays: number): Person {
  const roles = r.roles.map(({ notionId, name }) => ({ notionId, name }));

  const schedule = r.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
  const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);

  const sorted = r.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  const workingChange = sorted.find((c) => c.status === "working");
  const inactiveChange = sorted.findLast((c) => c.status === "inactive");
  const latest = sorted.at(-1);
  const active = latest !== undefined && ACTIVE_STATUSES.has(latest.status);

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
    statusChanges: r.statusChanges.map((sc) => ({ id: sc.id, date: sc.date, status: sc.status })),
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

async function fetchTransactions(): Promise<Transaction[]> {
  const records = await prisma.transaction.findMany();
  return records.map((r) => ({
    id: r.id,
    note: r.note,
    amount: r.amount,
    usdEquivalent: r.usdEquivalent,
    currency: r.currency,
    method: r.method as TransactionMethod,
    category: r.category,
    logicalDate: r.logicalDate,
    factualDate: r.factualDate ?? null,
    personId: r.personId ?? null,
    payeeName: r.payeeName,
  }));
}

export function isPersonActive(person: Person): boolean {
  return person.status === "Active";
}

export function getCachedPeople() {
  return cached("people", fetchPeople);
}

export function getCachedTransactions() {
  return cached("transactions", fetchTransactions);
}

export interface AllData {
  people: Person[];
  transactions: Transaction[];
}

export async function getAllData(): Promise<AllData> {
  const [people, transactions] = await Promise.all([getCachedPeople(), getCachedTransactions()]);
  return { people, transactions };
}
