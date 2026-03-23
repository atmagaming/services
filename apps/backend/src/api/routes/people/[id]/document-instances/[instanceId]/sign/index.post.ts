import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { prisma } from "services/prisma";
import { signGoogleDoc } from "services/signing";

export default handler({}, async ({ user, router: { id, instanceId } }) => {
  requirePermission(user, "canEditPeople");

  const instance = await prisma.personDocumentInstance.findUniqueOrThrow({ where: { id: instanceId, personId: id } });
  const { requestId, adminUrl, personUrl } = await signGoogleDoc(id, instance.driveFileId, instance.name);

  const signedDoc = await prisma.signedDocument.create({
    data: { instanceId, requestId, adminUrl, personUrl },
  });

  return { id: signedDoc.id, adminUrl, personUrl };
});
