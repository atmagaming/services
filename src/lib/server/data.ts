import type { Person, SensitiveData, Transaction, TransactionMethod } from "$lib/types";
import { prisma } from "$lib/server/prisma";
import { fetchAllRoles, fetchPersonRoles } from "$lib/server/notion";

const CACHE_TTL = 300_000; // 5 minutes in ms

// Roles and person→role assignments are fetched once on first use and kept in memory
let notionRolesPromise: Promise<Map<string, string>> | null = null;
let notionPersonRolesPromise: Promise<Map<string, string[]>> | null = null;

export function getNotionRoles(): Promise<Map<string, string>> {
  notionRolesPromise ??= fetchAllRoles()
    .then((roles) => new Map(roles.map((r) => [r.notionId, r.name])))
    .catch((e) => { console.error("Failed to load Notion roles: " + (e as Error).message); return new Map<string, string>(); });
  return notionRolesPromise;
}

function getNotionPersonRoles(): Promise<Map<string, string[]>> {
  notionPersonRolesPromise ??= fetchPersonRoles()
    .catch((e) => { console.error("Failed to load Notion person roles: " + (e as Error).message); return new Map<string, string[]>(); });
  return notionPersonRolesPromise;
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

function countMondaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 1) count++;
  }
  return count;
}

async function fetchPeople(): Promise<Person[]> {
  const [records, roleNames, personRoles] = await Promise.all([
    prisma.person.findMany({ include: { statusChanges: true, documents: true } }),
    getNotionRoles(),
    getNotionPersonRoles(),
  ]);
  return records.map((r) => {
    const roleIds = personRoles.get(r.notionPersonPageId) ?? [];
    const roles = roleIds
      .map((notionId) => ({ notionId, name: roleNames.get(notionId) ?? "" }))
      .filter((role) => role.name);
    return {
      id: r.id,
      name: r.name,
      firstName: r.firstName ?? "",
      lastName: r.lastName ?? "",
      nickname: r.nickname ?? "",
      image: r.image ?? "",
      identification: r.identification,
      passportNumber: r.passportNumber ?? "",
      passportIssueDate: r.passportIssueDate ?? "",
      passportIssuingAuthority: r.passportIssuingAuthority ?? "",
      weeklySchedule: r.weeklySchedule,
      hourlyRatePaid: r.hourlyRatePaid,
      hourlyRateAccrued: r.hourlyRateAccrued,
      email: r.email,
      notionPersonPageId: r.notionPersonPageId,
      telegramAccount: r.telegramAccount,
      discord: r.discord ?? "",
      linkedin: r.linkedin ?? "",
      description: r.description ?? "",
      statusChanges: r.statusChanges.map((sc) => ({ id: sc.id, date: sc.date, status: sc.status })),
      documents: r.documents.map((d) => ({ id: d.id, name: d.name, url: d.url, category: d.category as import("$lib/types").DocumentCategory })),
      roles,
    };
  });
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

const ACTIVE_STATUSES = new Set(["working", "vacation", "sick_leave"]);

export function isPersonActive(person: Person): boolean {
  const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  return latest !== undefined && ACTIVE_STATUSES.has(latest.status);
}

export function deriveSensitiveData(people: Person[]): SensitiveData[] {
  const now = new Date();
  const mondays = countMondaysInMonth(now.getFullYear(), now.getMonth());

  return people.map((person) => {
    const schedule = person.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
    const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);

    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    const workingChange = sorted.find((c) => c.status === "working");
    const inactiveChange = sorted.findLast((c) => c.status === "inactive");
    const latest = sorted.at(-1);
    const active = latest !== undefined && ACTIVE_STATUSES.has(latest.status);
    const status = active ? "Active" : "Inactive";

    const monthlyPaid = hoursPerWeek * person.hourlyRatePaid * mondays;
    const monthlyInvested = hoursPerWeek * person.hourlyRateAccrued * mondays;

    return {
      id: person.id,
      name: person.name,
      personId: person.id,
      hourlyPaid: person.hourlyRatePaid,
      hourlyInvested: person.hourlyRateAccrued,
      schedule,
      hoursPerWeek,
      monthlyPaid,
      monthlyInvested,
      monthlyTotal: monthlyPaid + monthlyInvested,
      startDate: workingChange?.date ?? null,
      endDate: inactiveChange?.date ?? null,
      status,
    };
  });
}

export function getCachedPeople() {
  return cached("people", fetchPeople);
}
export function getCachedTransactions() {
  return cached("transactions", fetchTransactions);
}

export interface AllData {
  people: Person[];
  sensitiveData: SensitiveData[];
  transactions: Transaction[];
}

export async function getAllData(): Promise<AllData> {
  const [people, transactions] = await Promise.all([getCachedPeople(), getCachedTransactions()]);
  const sensitiveData = deriveSensitiveData(people);
  return { people, sensitiveData, transactions };
}
