import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { prisma } from "services/prisma";
import z from "zod";

export default handler(
  {
    body: {
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().optional(),
      amountPaid: z.number().optional(),
      amountAccrued: z.number().optional(),
    },
  },
  async ({ user, body, router: { paymentId } }) => {
    requirePermission(user, "canEditTransactions");
    await prisma.monthlyPayment.update({ where: { id: paymentId }, data: body });
  },
);
