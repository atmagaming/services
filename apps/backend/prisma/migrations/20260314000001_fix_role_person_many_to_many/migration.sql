-- CreateTable: Role (deduplicated by notionId)
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notionId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex: unique notionId on Role
CREATE UNIQUE INDEX "Role_notionId_key" ON "Role"("notionId");

-- Migrate unique roles from PersonRole:
--   - For rows with a non-empty notionId: group by notionId, pick any name
--   - For rows with empty notionId: group by name, assign a synthetic notionId so uniqueness holds
INSERT INTO "Role" ("id", "notionId", "name")
SELECT
    MIN("id"),
    CASE
        WHEN "notionId" = '' THEN 'local_' || MIN("id")
        ELSE "notionId"
    END,
    MAX("name")
FROM "PersonRole"
GROUP BY CASE WHEN "notionId" = '' THEN "name" ELSE "notionId" END;

-- CreateTable: implicit Prisma M2M junction (_PersonToRole)
CREATE TABLE "_PersonToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PersonToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PersonToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate person-role associations
INSERT INTO "_PersonToRole" ("A", "B")
SELECT DISTINCT pr."personId", r."id"
FROM "PersonRole" pr
JOIN "Role" r ON (
    (pr."notionId" != '' AND r."notionId" = pr."notionId") OR
    (pr."notionId" = '' AND r."name" = pr."name" AND r."notionId" LIKE 'local_%')
);

-- Indexes required by Prisma for implicit M2M
CREATE UNIQUE INDEX "_PersonToRole_AB_unique" ON "_PersonToRole"("A", "B");
CREATE INDEX "_PersonToRole_B_index" ON "_PersonToRole"("B");

-- DropTable: old PersonRole
DROP TABLE "PersonRole";
