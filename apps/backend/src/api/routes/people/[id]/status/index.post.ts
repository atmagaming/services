import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { PersonStatus, prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      status: z.enum(PersonStatus),
      date: z.coerce.date(),
    },
  },
  async ({ user, body: { status, date }, router: { id } }) => {
    requirePermission(user, "canEditPeople");

    await prisma.personStatusChange.create({
      data: {
        personId: id,
        status,
        date,
      },
    });
  },
);
