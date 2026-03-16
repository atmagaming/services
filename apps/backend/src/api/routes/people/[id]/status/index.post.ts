import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { PersonStatus, prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      status: z.enum(Object.values(PersonStatus) as [string, ...string[]]),
      date: z.string().nullable(),
    },
  },
  async ({ user, body, router: { id } }) => {
    requirePermission(user, "canEditPeople");

    await prisma.personStatusChange.create({
      data: {
        personId: id,
        status: body.status as PersonStatus,
        date: new Date(body.date ?? new Date()),
      },
    });
  },
);
