-- CreateTable
CREATE TABLE "SigningRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "adminUrl" TEXT NOT NULL,
    "personUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SigningRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
