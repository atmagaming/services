import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { Currency, prisma, TransactionMethod } from "services/prisma";
import z from "zod";

export default handler(
  {
    body: {
      personId: z.string().optional(),
      currency: z.enum(Currency),
      amount: z.number(),
      logicalDate: z.coerce.date(),
      factualDate: z.coerce.date().optional(),
      method: z.enum(TransactionMethod),
      category: z.string().optional(),
      payeeName: z.string().optional(),
      note: z.string().optional(),
    },
  },
  async ({ user, body }) => {
    requirePermission(user, "canEditTransactions");
    const { id } = await prisma.transaction.create({ data: body });
    return id;
  },
);
