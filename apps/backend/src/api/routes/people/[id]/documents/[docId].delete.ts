import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { google } from "services/google";
import { prisma } from "services/prisma";

// Delete a person's document
export default handler(async ({ user, router: { docId } }) => {
  requirePermission(user, "canEditPeople");
  const driveFile = await google.drive.file(docId);
  await Promise.all([prisma.personDocument.delete({ where: { id: docId } }), driveFile.delete()]);
});
