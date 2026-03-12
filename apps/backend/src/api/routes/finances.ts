import { Hono } from "hono";
import { getUser } from "../auth";
import {
  aggregateExpensesByMonth,
  calculateInvestmentTimeline,
  calculateRevenueShares,
  projectExpenses,
  RELEASE_MONTH,
} from "../calculations";
import { getCachedPeople } from "../repositories/people";
import { getCachedTransactions } from "../repositories/transactions";

const finances = new Hono();

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

finances.get("/", async (c) => {
  const user = getUser(c);
  const currentPersonId = user?.personId ?? null;
  const canViewRevenueShares = user?.canViewRevenueShares ?? false;
  const isAuthenticated = !!user;

  const [people, transactions] = await Promise.all([getCachedPeople(), getCachedTransactions()]);
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
    investmentByPerson.set(tx.personId, (investmentByPerson.get(tx.personId) ?? 0) + Math.abs(tx.usdEquivalent));
  }

  const currentShareEntry = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const projectedShareEntry = revenueShares.find((rs) => rs.month === "2027-10") ?? null;

  const rows = activePeople.map((person) => {
    const name = personNames.get(person.id) ?? person.id.slice(0, 8);
    return {
      personId: person.id,
      name,
      hoursPerWeek: person.hoursPerWeek,
      paidRate: person.hourlyRate.paid,
      investedRate: person.hourlyRate.accrued,
      monthlyPaid: person.monthlyPaid,
      monthlyAccrued: person.monthlyAccrued,
      monthlyTotal: person.monthlyTotal,
      currentInvestment: investmentByPerson.get(person.id) ?? 0,
      currentShare: currentShareEntry?.shares[name] ?? 0,
      projectedShare: projectedShareEntry?.shares[name] ?? 0,
      isCurrentUser: person.id === currentPersonId,
    };
  });

  return c.json({
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
  });
});

finances.get("/transactions", async (c) => {
  const user = getUser(c);
  const canViewTransactions = user?.canViewTransactions ?? false;
  const isAuthenticated = !!user;
  const userEmail = user?.email ?? "";

  const [unsortedTransactions, allPeople] = await Promise.all([getCachedTransactions(), getCachedPeople()]);
  const transactions = unsortedTransactions.toSorted((a, b) => b.logicalDate.localeCompare(a.logicalDate));

  const personEmailMap = new Map(allPeople.map((p) => [p.id, p.email]));
  const personIdsInTransactions = new Set(transactions.filter((t) => t.personId).map((t) => t.personId as string));

  if (canViewTransactions) {
    const myPersonIds = allPeople
      .filter((p) => p.email === userEmail && personIdsInTransactions.has(p.id))
      .map((p) => p.id);
    return c.json({ transactions, highlightPersonIds: myPersonIds, maskedPersonIds: [] });
  }

  const maskedPersonIds = isAuthenticated
    ? allPeople.filter((p) => personEmailMap.get(p.id) !== userEmail && personIdsInTransactions.has(p.id)).map((p) => p.id)
    : [...personIdsInTransactions];

  const myPersonIds = isAuthenticated
    ? allPeople.filter((p) => personEmailMap.get(p.id) === userEmail && personIdsInTransactions.has(p.id)).map((p) => p.id)
    : [];

  const maskedSet = new Set(maskedPersonIds);
  const maskedTransactions = transactions.map((t) =>
    t.personId && maskedSet.has(t.personId)
      ? { ...t, note: "Team Salaries", payeeName: "ATMA Team", category: "Salaries" }
      : t,
  );

  return c.json({ transactions: maskedTransactions, highlightPersonIds: myPersonIds, maskedPersonIds });
});

export default finances;
