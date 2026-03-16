import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema",
  datasource: {
    // Local SQLite file for migration generation only.
    // Migrations are applied to Turso via: turso db shell <db> < migration.sql
    url: "file:./prisma/dev.db",
  },
  migrations: {
    path: "./prisma/migrations",
  },
});
