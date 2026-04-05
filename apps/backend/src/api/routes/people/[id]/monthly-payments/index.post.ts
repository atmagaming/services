import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { prisma } from "services/prisma";
import z from "zod";

export default handler(
  {
    body: {
      month: z.number().int().min(1).max(12),
      year: z.number().int(),
      amountPaid: z.number(),
      amountAccrued: z.number(),
    },
  },
  async ({ user, body, router: { id } }) => {
    requirePermission(user, "canEditTransactions");
    const result = await prisma.monthlyPayment.create({ data: { ...body, personId: id } });
    return result.id as string;
  },
);
