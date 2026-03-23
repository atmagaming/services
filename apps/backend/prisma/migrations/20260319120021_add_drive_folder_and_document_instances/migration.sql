-- AlterTable
ALTER TABLE "Person" ADD COLUMN "driveFolderId" TEXT;

-- CreateTable
CREATE TABLE "PersonDocumentInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonDocumentInstance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SignedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "adminUrl" TEXT NOT NULL,
    "personUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignedDocument_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "PersonDocumentInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
