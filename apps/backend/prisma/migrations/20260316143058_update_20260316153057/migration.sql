/*
  Warnings:

  - You are about to alter the column `idIssueDate` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

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
    "hourlyRatePaid" REAL NOT NULL DEFAULT 0,
    "hourlyRateAccrued" REAL NOT NULL DEFAULT 0,
    "email" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "linkedin" TEXT,
    "description" TEXT
);
INSERT INTO "new_Person" ("description", "discord", "email", "firstName", "hourlyRateAccrued", "hourlyRatePaid", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "schedule", "telegram") SELECT "description", "discord", "email", "firstName", "hourlyRateAccrued", "hourlyRatePaid", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "schedule", "telegram" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
