import { handler } from "api/utils";
import { prisma, type Transaction } from "services/prisma";

type Mask<T, K extends keyof T> = Omit<T, K> & { [P in K]: null };
function maskTransaction(t: Transaction): Mask<Transaction, "amount" | "currency"> {
  return { ...t, amount: null, currency: null, note: "Team Salaries", payeeName: "ATMA Team", category: "Salaries" };
}

export default handler({}, async ({ user }) => {
  const { canViewTransactions = false, personId } = user ?? {};

  const allTransactions = await prisma.transaction.findMany({
    orderBy: { logicalDate: "desc" },
  });

  // If the user has permission to view transactions, return all transactions with full details.
  if (canViewTransactions) return allTransactions;

  // If the user does not have permission but is associated with a person, return all transactions but mask details for transactions not associated with that person.
  if (personId)
    return allTransactions.map((t) => (t.personId === personId || t.personId === null ? t : maskTransaction(t)));

  // If the user is not associated with any person, return all transactions but mask details for all transactions.
  return allTransactions.map((t) => (t.personId === null ? t : maskTransaction(t)));
});
