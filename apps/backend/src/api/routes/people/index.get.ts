import { handler } from "api/utils";
import type { PersonStatus, PersonStatusChange } from "services/prisma";
import { prisma } from "services/prisma";

/** Returns the last status change that is not in the future */
export function currentStatus(statusChanges: PersonStatusChange[]): PersonStatus | null {
  const today = new Date();
  const latest = statusChanges
    .filter((c) => c.date <= today)
    .toSorted((a, b) => a.date.getTime() - b.date.getTime())
    .at(-1);
  return latest?.status ?? null;
}

// Get all people, with more details if the user has permission to view personal data
export default handler({}, async ({ user }) => {
  if (user?.canViewPersonalData) {
    const people = await prisma.person.findMany({ include: { statusChanges: true, documents: true, roles: true } });

    // Add currentStatus
    return people.map(({ statusChanges, ...rest }) => ({
      ...rest,
      statusChanges,
      currentStatus: currentStatus(statusChanges),
    }));
  }

  const people = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      roles: true,
      statusChanges: true,
    },
  });

  return (
    people
      // Add currentStatus
      .map(({ statusChanges, ...rest }) => ({
        ...rest,
        currentStatus: currentStatus(statusChanges),
      }))
      // Filter out people whose current status is inactive or null
      .filter(({ currentStatus: s }) => s !== "inactive" && s !== null)
  );
});
