import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { google } from "services/google";
import { prisma } from "services/prisma";

export default handler({}, async ({ user, router: { id, instanceId } }) => {
  requirePermission(user, "canEditPeople");

  const instance = await prisma.personDocumentInstance.findUniqueOrThrow({ where: { id: instanceId, personId: id } });

  const driveFile = await google.drive.file(instance.driveFileId);
  await Promise.all([driveFile.delete(), prisma.personDocumentInstance.delete({ where: { id: instanceId } })]);
});
