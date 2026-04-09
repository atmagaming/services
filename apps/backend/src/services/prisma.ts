// Re-export Prisma Client types for convenience
export * from "@prisma/client";

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { env } from "env";

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

function hoursPerWeek(schedule: string | null | undefined): number {
  return (schedule ?? "0")
    .split(",")
    .map(Number)
    .reduce((a, b) => a + b, 0);
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter }).$extends({
    result: {
      person: {
        hoursPerWeek: {
          needs: { schedule: true },
          compute({ schedule }) {
            return hoursPerWeek(schedule);
          },
        },
        paidWeekly: {
          needs: { paidHourly: true, schedule: true },
          compute({ paidHourly, schedule }) {
            return paidHourly * hoursPerWeek(schedule);
          },
        },
        accruedWeekly: {
          needs: { accruedHourly: true, schedule: true },
          compute({ accruedHourly, schedule }) {
            return accruedHourly * hoursPerWeek(schedule);
          },
        },
        paidMonthly: {
          needs: { paidHourly: true, schedule: true },
          compute({ paidHourly, schedule }) {
            return (paidHourly * hoursPerWeek(schedule) * 52) / 12;
          },
        },
        accruedMonthly: {
          needs: { accruedHourly: true, schedule: true },
          compute({ accruedHourly, schedule }) {
            return (accruedHourly * hoursPerWeek(schedule) * 52) / 12;
          },
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
