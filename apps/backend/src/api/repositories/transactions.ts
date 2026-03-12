import type { Transaction, TransactionMethod } from "@atma/types";
import { cached } from "../cache";
import { prisma } from "../prisma";

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

export function getCachedTransactions() {
  return cached("transactions", fetchTransactions);
}
