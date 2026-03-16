import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { PersonStatus, prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      status: z.enum(Object.values(PersonStatus)).optional(),
      date: z.string().optional(),
    },
  },
  async ({ user, body, router: { statusId } }) => {
    requirePermission(user, "canEditPeople");

    await prisma.personStatusChange.update({
      where: { id: statusId },
      data: {
        status: body.status,
        date: body.date !== undefined ? new Date(body.date) : undefined,
      },
    });
  },
);
