/*
  Warnings:

  - Added the required column `personId` to the `MonthlyPayment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amountPaid" REAL NOT NULL,
    "amountAccrued" REAL NOT NULL,
    CONSTRAINT "MonthlyPayment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyPayment" ("amountAccrued", "amountPaid", "id", "month", "year") SELECT "amountAccrued", "amountPaid", "id", "month", "year" FROM "MonthlyPayment";
DROP TABLE "MonthlyPayment";
ALTER TABLE "new_MonthlyPayment" RENAME TO "MonthlyPayment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
