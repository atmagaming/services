import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { DocumentCategory } from "services/prisma";
import { sign } from "services/signing";
import { z } from "zod";

export default handler(
  { body: { documentCategory: z.enum(Object.values(DocumentCategory)) } },
  async ({ user, body: { documentCategory }, router: { id } }) => {
    requirePermission(user, "canEditPeople");
    await sign(id, documentCategory);
  },
);
