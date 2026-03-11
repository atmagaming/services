-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "identification" TEXT NOT NULL DEFAULT '',
    "passportNumber" TEXT NOT NULL DEFAULT '',
    "passportIssueDate" TEXT NOT NULL DEFAULT '',
    "passportIssuingAuthority" TEXT NOT NULL DEFAULT '',
    "weeklySchedule" TEXT NOT NULL DEFAULT '4,4,4,4,4,0,0',
    "hourlyRatePaid" REAL NOT NULL DEFAULT 0,
    "hourlyRateAccrued" REAL NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL DEFAULT '',
    "notionPersonPageId" TEXT NOT NULL DEFAULT '',
    "telegramAccount" TEXT NOT NULL DEFAULT '',
    "discord" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Person" ("createdAt", "description", "discord", "email", "hourlyRateAccrued", "hourlyRatePaid", "id", "identification", "image", "linkedin", "name", "nickname", "notionPersonPageId", "telegramAccount", "updatedAt", "weeklySchedule") SELECT "createdAt", "description", "discord", "email", "hourlyRateAccrued", "hourlyRatePaid", "id", "identification", "image", "linkedin", "name", "nickname", "notionPersonPageId", "telegramAccount", "updatedAt", "weeklySchedule" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
