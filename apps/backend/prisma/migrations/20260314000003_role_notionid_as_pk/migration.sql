-- Use notionId as the primary key for Role, eliminating the redundant id field

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create new Role table with notionId as PK
CREATE TABLE "new_Role" (
    "notionId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

INSERT INTO "new_Role" ("notionId", "name")
SELECT "notionId", "name" FROM "Role";

-- Create new junction table referencing notionId
CREATE TABLE "new_PersonToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "new_PersonToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_PersonToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "new_Role" ("notionId") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PersonToRole" ("A", "B")
SELECT ptr."A", r."notionId"
FROM "_PersonToRole" ptr
JOIN "Role" r ON r."id" = ptr."B";

CREATE UNIQUE INDEX "new_PersonToRole_AB_unique" ON "new_PersonToRole"("A", "B");
CREATE INDEX "new_PersonToRole_B_index" ON "new_PersonToRole"("B");

-- Swap tables
DROP TABLE "_PersonToRole";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
ALTER TABLE "new_PersonToRole" RENAME TO "_PersonToRole";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
