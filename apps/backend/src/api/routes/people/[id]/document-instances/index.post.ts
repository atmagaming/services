import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { DocumentCategory, prisma } from "services/prisma";
import { cloneAndFillTemplate } from "services/signing";
import { z } from "zod";

export default handler(
  { body: { templateType: z.enum(DocumentCategory), name: z.string().optional() } },
  async ({ user, body: { templateType, name }, router: { id } }) => {
    requirePermission(user, "canEditPeople");

    const { driveFileId, docName } = await cloneAndFillTemplate(id, templateType, name);

    const instance = await prisma.personDocumentInstance.create({
      data: { personId: id, templateType, name: docName, driveFileId },
      include: { signedDocs: true },
    });

    return instance;
  },
);
