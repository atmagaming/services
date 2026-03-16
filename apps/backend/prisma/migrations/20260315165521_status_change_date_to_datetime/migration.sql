/*
  Warnings:

  - You are about to alter the column `date` on the `PersonStatusChange` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PersonStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "PersonStatusChange_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PersonStatusChange" ("date", "id", "personId", "status") SELECT "date" || 'T00:00:00.000Z', "id", "personId", "status" FROM "PersonStatusChange";
DROP TABLE "PersonStatusChange";
ALTER TABLE "new_PersonStatusChange" RENAME TO "PersonStatusChange";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
