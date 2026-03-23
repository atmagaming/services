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
    "schedule" TEXT NOT NULL DEFAULT '4,4,4,4,4,0,0',
    "paidHourly" REAL NOT NULL DEFAULT 0,
    "accruedHourly" REAL NOT NULL DEFAULT 0,
    "email" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "linkedin" TEXT,
    "description" TEXT
);
INSERT INTO "new_Person" ("accruedHourly", "description", "discord", "email", "firstName", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "paidHourly", "schedule", "telegram") SELECT "accruedHourly", "description", "discord", "email", "firstName", "id", "idIssueDate", "idIssuingAuthority", "idNumber", "idType", "image", "lastName", "linkedin", "name", "paidHourly", coalesce("schedule", '4,4,4,4,4,0,0') AS "schedule", "telegram" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
