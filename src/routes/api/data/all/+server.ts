import {
  aggregateExpensesByMonth,
  calculateInvestmentTimeline,
  calculateRevenueShares,
  projectExpenses,
  RELEASE_MONTH,
} from "$lib/server/calculations";
import { getAllData } from "$lib/server/data";
import type { RequestHandler } from "./$types";

function anonymize(record: Record<string, number>, myName: string | null): Record<string, number> {
  let me = 0;
  let others = 0;
  for (const [name, value] of Object.entries(record)) {
    if (name === myName) me += value;
    else others += value;
  }
  const result: Record<string, number> = {};
  if (myName && me > 0) result[myName] = me;
  if (others > 0) result.Others = others;
  return result;
}

export const GET: RequestHandler = async ({ locals }) => {
  const currentPersonId = locals.user?.personId ?? null;
  const canViewRevenueShares = locals.user?.canViewRevenueShares ?? false;
  const isAuthenticated = !!locals.user;

  const { transactions, people } = await getAllData();
  const activePeople = people.filter((p) => p.status === "Active");

  const monthlyExpenses = aggregateExpensesByMonth(transactions);
  const projections = projectExpenses(people, RELEASE_MONTH);

  const monthlyPaid = Math.round(activePeople.reduce((s, p) => s + p.monthlyPaid, 0));
  const monthlyAccrued = Math.round(activePeople.reduce((s, p) => s + p.monthlyAccrued, 0));
  const monthlyTotal = monthlyPaid + monthlyAccrued;

  const personNames = new Map<string, string>();
  for (const person of people) personNames.set(person.id, person.name);

  const revenueShares = calculateRevenueShares(transactions, people, personNames, RELEASE_MONTH);
  const investmentTimeline = calculateInvestmentTimeline(transactions, people, personNames, RELEASE_MONTH);

  const currentUserName = currentPersonId ? (personNames.get(currentPersonId) ?? null) : null;
  const displayRevenueShares = canViewRevenueShares
    ? revenueShares
    : revenueShares.map((rs) => ({ ...rs, shares: anonymize(rs.shares, currentUserName) }));
  const displayInvestmentTimeline = canViewRevenueShares
    ? investmentTimeline
    : investmentTimeline.map((ip) => ({ ...ip, values: anonymize(ip.values, currentUserName) }));

  const investmentByPerson = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.personId) continue;
    if (tx.method !== "Accrued" && !(tx.method === "Invested" && tx.amount > 0)) continue;
    const current = investmentByPerson.get(tx.personId) ?? 0;
    investmentByPerson.set(tx.personId, current + Math.abs(tx.usdEquivalent));
  }

  const currentShareEntry = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const projectedShareEntry = revenueShares.find((rs) => rs.month === "2027-10") ?? null;

  const rows = activePeople.map((person) => {
    const name = personNames.get(person.id) ?? person.id.slice(0, 8);
    const currentInvestment = investmentByPerson.get(person.id) ?? 0;
    const currentShare = currentShareEntry?.shares[name] ?? 0;
    const projectedShare = projectedShareEntry?.shares[name] ?? 0;

    return {
      personId: person.id,
      name,
      hoursPerWeek: person.hoursPerWeek,
      paidRate: person.hourlyRate.paid,
      investedRate: person.hourlyRate.accrued,
      monthlyPaid: person.monthlyPaid,
      monthlyAccrued: person.monthlyAccrued,
      monthlyTotal: person.monthlyTotal,
      currentInvestment,
      currentShare,
      projectedShare,
      isCurrentUser: person.id === currentPersonId,
    };
  });

  return new Response(
    JSON.stringify({
      cards: [
        { label: "Monthly Paid", value: monthlyPaid, color: "var(--red)", bg: "#fef2f2" },
        { label: "Monthly Accrued", value: monthlyAccrued, color: "var(--orange)", bg: "#fffbeb" },
        { label: "Monthly Total", value: monthlyTotal, color: "var(--blue)", bg: "#eff6ff" },
      ],
      monthlyExpenses,
      projections,
      revenueShares: displayRevenueShares,
      investmentTimeline: displayInvestmentTimeline,
      teamRows: rows,
      currentPersonId,
      canViewRevenueShares,
      isAuthenticated,
      teamCount: activePeople.length,
    }),
    { headers: { "content-type": "application/json" } },
  );
};
