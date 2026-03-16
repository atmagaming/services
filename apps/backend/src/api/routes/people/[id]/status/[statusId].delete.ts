import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { prisma } from "services/prisma";

export default handler(async ({ user, router: { statusId } }) => {
  requirePermission(user, "canEditPeople");
  await prisma.personStatusChange.delete({ where: { id: statusId } });
});
