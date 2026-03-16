-- Person: use notionId as the new id (primary key)
-- Role: rename notionId to id
-- Update join table references accordingly

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- 1. Recreate Person with notionId as the new id
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
    "telegram" TEXT,
    "discord" TEXT,
    "linkedin" TEXT,
    "description" TEXT
);

INSERT INTO "new_Person" ("id", "name", "image", "firstName", "lastName", "idType", "idNumber", "idIssueDate", "idIssuingAuthority", "schedule", "hourlyRatePaid", "hourlyRateAccrued", "email", "telegram", "discord", "linkedin", "description")
SELECT "notionId", "name", "image", "firstName", "lastName", "idType", "idNumber", "idIssueDate", "idIssuingAuthority", "schedule", "hourlyRatePaid", "hourlyRateAccrued", "email", "telegram", "discord", "linkedin", "description"
FROM "Person"
WHERE "notionId" IS NOT NULL;

-- 2. Recreate Role with notionId renamed to id
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

INSERT INTO "new_Role" ("id", "name")
SELECT "notionId", "name" FROM "Role";

-- 3. Recreate join table, mapping old Person.id -> Person.notionId
CREATE TABLE "new__PersonToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PersonToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "new_Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PersonToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "new_Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new__PersonToRole" ("A", "B")
SELECT p."notionId", ptr."B"
FROM "_PersonToRole" ptr
JOIN "Person" p ON p."id" = ptr."A"
WHERE p."notionId" IS NOT NULL;

-- 4. Recreate dependent tables with FK to new Person.id (notionId)
CREATE TABLE "new_PersonStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "PersonStatusChange_personId_fkey" FOREIGN KEY ("personId") REFERENCES "new_Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PersonStatusChange" ("id", "personId", "date", "status")
SELECT sc."id", p."notionId", sc."date", sc."status"
FROM "PersonStatusChange" sc
JOIN "Person" p ON p."id" = sc."personId"
WHERE p."notionId" IS NOT NULL;

CREATE TABLE "new_PersonDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'other',
    CONSTRAINT "PersonDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "new_Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PersonDocument" ("id", "personId", "name", "url", "category")
SELECT d."id", p."notionId", d."name", d."url", d."category"
FROM "PersonDocument" d
JOIN "Person" p ON p."id" = d."personId"
WHERE p."notionId" IS NOT NULL;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factualDate" DATETIME,
    "logicalDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "note" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL DEFAULT 'Paid',
    "personId" TEXT,
    "payeeName" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Transaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "new_Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" ("id", "factualDate", "logicalDate", "amount", "currency", "note", "category", "method", "personId", "payeeName")
SELECT t."id", t."factualDate", t."logicalDate", t."amount", t."currency", t."note", t."category", t."method",
    CASE WHEN t."personId" IS NOT NULL THEN p."notionId" ELSE NULL END,
    t."payeeName"
FROM "Transaction" t
LEFT JOIN "Person" p ON p."id" = t."personId";

-- 5. Drop old tables
DROP TABLE "_PersonToRole";
DROP TABLE "PersonStatusChange";
DROP TABLE "PersonDocument";
DROP TABLE "Transaction";
DROP TABLE "Person";
DROP TABLE "Role";

-- 6. Rename new tables
ALTER TABLE "new_Person" RENAME TO "Person";
ALTER TABLE "new_Role" RENAME TO "Role";
ALTER TABLE "new__PersonToRole" RENAME TO "_PersonToRole";
ALTER TABLE "new_PersonStatusChange" RENAME TO "PersonStatusChange";
ALTER TABLE "new_PersonDocument" RENAME TO "PersonDocument";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

-- 7. Recreate indexes
CREATE UNIQUE INDEX "_PersonToRole_AB_unique" ON "_PersonToRole"("A", "B");
CREATE INDEX "_PersonToRole_B_index" ON "_PersonToRole"("B");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
