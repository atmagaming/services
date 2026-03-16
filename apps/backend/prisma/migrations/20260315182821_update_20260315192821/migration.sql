-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factualDate" DATETIME,
    "logicalDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "note" TEXT,
    "category" TEXT,
    "method" TEXT NOT NULL,
    "personId" TEXT,
    "payeeName" TEXT,
    CONSTRAINT "Transaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "category", "currency", "factualDate", "id", "logicalDate", "method", "note", "payeeName", "personId") SELECT "amount", "category", "currency", "factualDate", "id", "logicalDate", "method", "note", "payeeName", "personId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
