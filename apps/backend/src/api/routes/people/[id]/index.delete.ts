import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { notion } from "services/notion";
import { prisma } from "services/prisma";

export default handler(async ({ user, router: { id } }) => {
  requirePermission(user, "canEditPeople");
  await Promise.all([notion.people.delete({ where: { id } }), prisma.person.delete({ where: { id } })]);
});
