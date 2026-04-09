import { handler } from "api/utils";
import { prisma } from "services/prisma";

type MonthlyPaymentRecord = {
  id: string;
  personId: string;
  month: number;
  year: number;
  amountPaid: number;
  amountAccrued: number;
};

export default handler({}, async ({ router: { id } }) => {
  const records = await prisma.monthlyPayment.findMany({
    where: { personId: id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return records as MonthlyPaymentRecord[];
});
