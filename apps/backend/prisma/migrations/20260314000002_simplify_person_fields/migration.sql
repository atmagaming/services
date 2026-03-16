-- Recreate Person table with renamed/removed fields and nullable optionals
-- Converts empty strings to NULL for optional fields (String? semantics)

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
    "idIssueDate" TEXT,
    "idIssuingAuthority" TEXT,
    "schedule" TEXT NOT NULL DEFAULT '4,4,4,4,4,0,0',
    "hourlyRatePaid" REAL NOT NULL DEFAULT 0,
    "hourlyRateAccrued" REAL NOT NULL DEFAULT 0,
    "email" TEXT,
    "notionId" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "linkedin" TEXT,
    "description" TEXT
);

INSERT INTO "new_Person" (
    "id", "name", "image", "firstName", "lastName",
    "idType", "idNumber", "idIssueDate", "idIssuingAuthority",
    "schedule", "hourlyRatePaid", "hourlyRateAccrued",
    "email", "notionId", "telegram", "discord", "linkedin", "description"
)
SELECT
    "id", "name",
    NULLIF("image", ''), NULLIF("firstName", ''), NULLIF("lastName", ''),
    NULLIF("identification", ''), NULLIF("passportNumber", ''), NULLIF("passportIssueDate", ''), NULLIF("passportIssuingAuthority", ''),
    "weeklySchedule", "hourlyRatePaid", "hourlyRateAccrued",
    NULLIF("email", ''), NULLIF("notionPersonPageId", ''), NULLIF("telegramAccount", ''), NULLIF("discord", ''), NULLIF("linkedin", ''), NULLIF("description", '')
FROM "Person";

DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
