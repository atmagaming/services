import { PrismaLibSql } from "@prisma/adapter-libsql";
import { env } from "$env/dynamic/private";
import { PrismaClient } from "../../../generated/prisma/client";

// In development, SvelteKit hot-reloads modules on every change, which would create a new
// PrismaClient on each reload and quickly exhaust the database connection limit.
// Storing the client on globalThis (which survives module reloads) prevents this.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
    authToken: env.TURSO_AUTH_TOKEN ?? undefined,
  });
  return new PrismaClient({ adapter });
}

// Reuse the existing client if available, otherwise create a new one.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Save the client for reuse across hot reloads. Skipped in production since modules
// are only loaded once there and globalThis caching is unnecessary.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
