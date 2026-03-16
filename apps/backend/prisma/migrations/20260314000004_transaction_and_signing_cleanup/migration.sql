-- Normalize Transaction dates to ISO 8601, remove usdEquivalent/createdAt/updatedAt
-- Drop SigningRequest table

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

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
    CONSTRAINT "Transaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" ("id", "factualDate", "logicalDate", "amount", "currency", "note", "category", "method", "personId", "payeeName")
SELECT
    "id",
    CASE WHEN "factualDate" IS NOT NULL THEN "factualDate" || 'T00:00:00.000Z' ELSE NULL END,
    "logicalDate" || 'T00:00:00.000Z',
    "amount", "currency", "note", "category", "method", "personId", "payeeName"
FROM "Transaction";

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

DROP TABLE "SigningRequest";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
