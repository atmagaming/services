import { env } from "env";
import { google } from "services/google";
import type { DriveFolder } from "services/google";
import { prisma } from "services/prisma";

/** Returns the person's personal Drive folder, creating it first if it doesn't exist yet. */
export async function ensurePersonalFolder(personId: string): Promise<DriveFolder> {
  const person = await prisma.person.findUniqueOrThrow({
    where: { id: personId },
    select: { name: true, driveFolderId: true },
  });

  if (person.driveFolderId) return google.drive.folder(person.driveFolderId);

  const parentFolder = await google.drive.folder(env.GOOGLE_DRIVE_PERSONAL_FOLDERS_PARENT_ID);
  const folder = await parentFolder.createSubfolder(person.name);
  await prisma.person.update({ where: { id: personId }, data: { driveFolderId: folder.id } });

  return folder;
}
