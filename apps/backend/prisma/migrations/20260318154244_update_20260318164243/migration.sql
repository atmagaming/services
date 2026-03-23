/*
  Warnings:

  - You are about to drop the column `hourlyRateAccrued` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRatePaid` on the `Person` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "idIssueDate" DATETIME,
    "idIssuingAuthority" TEXT,
    "schedule" TEXT DEFAULT '4,4,4,4,4,0,0',
    "paidHourly" REAL NOT NULL DEFAULT 0,
    "accruedHourly" REAL NOT NULL DEFAULT 0,
    "email" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "linkedin" TEXT,
    "description" TEXT
);
INSERT INTO "new_Person" ("description", "discord", "email", "firstName", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "schedule", "telegram") SELECT "description", "discord", "email", "firstName", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "schedule", "telegram" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
