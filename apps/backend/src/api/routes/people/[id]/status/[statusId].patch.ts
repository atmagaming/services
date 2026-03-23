import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { PersonStatus, prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      status: z.enum(PersonStatus).optional(),
      date: z.coerce.date().optional(),
    },
  },
  async ({ user, body, router: { statusId } }) => {
    requirePermission(user, "canEditPeople");

    await prisma.personStatusChange.update({
      where: { id: statusId },
      data: {
        status: body.status,
        date: body.date,
      },
    });
  },
);
