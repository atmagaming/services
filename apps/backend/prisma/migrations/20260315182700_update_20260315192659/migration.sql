-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PersonDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "PersonDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PersonDocument" ("category", "id", "name", "personId", "url") SELECT "category", "id", "name", "personId", "url" FROM "PersonDocument";
DROP TABLE "PersonDocument";
ALTER TABLE "new_PersonDocument" RENAME TO "PersonDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
