import { type api } from "./client";

export type { SessionUser } from "@atma/backend";

export type Person = (typeof api.people.$get.$response)[number];
export type PersonFull = Extract<Person, { paidHourly: number }>;

export function isPersonFull(person: Person): person is PersonFull {
  return "paidHourly" in person;
}

export type ChartSeries = { name: string; color: string; data: (number | null)[]; projData: (number | null)[] };
export type MonthlyExpense = { month: string; paid: number; accrued: number };
export type ProjectionMonth = { month: string; paid: number; accrued: number };
export type InvestmentPoint = { month: string; isProjected: boolean; values: Record<string, number> };
export type RevenueShare = { month: string; isProjected: boolean; shares: Record<string, number> };

export type PersonStatusChange = PersonFull["statusChanges"][number];
export type PersonStatus = PersonStatusChange["status"];

export type Transaction = (typeof api.transactions.$get.$response)[number];
