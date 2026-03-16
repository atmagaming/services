import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { notion } from "services/notion";
import { IdType, prisma } from "services/prisma";
import { z } from "zod";

export default handler(
  {
    body: {
      name: z.string().optional(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      identification: z
        .object({
          type: z.enum(Object.values(IdType)).nullable(),
          number: z.string().nullable(),
          issueDate: z.string().nullable(),
          issuingAuthority: z.string().nullable(),
        })
        .partial()
        .optional(),
      schedule: z.string().nullable().optional(),
      hourlyRatePaid: z.number().nullable().optional(),
      hourlyRateAccrued: z.number().nullable().optional(),
      email: z.string().nullable().optional(),
      telegram: z.string().nullable().optional(),
      discord: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      roles: z
        .array(z.object({ id: z.string() }))
        .nullable()
        .optional(),
    },
  },
  async ({ user, body, router: { id } }) => {
    requirePermission(user, "canEditPeople");

    // In notion only update name, roles, icon
    const notionUpdate = notion.people.update({
      where: { id },
      data: {
        name: body.name,
      },
      $icon: body.image,
    });

    // Update main prisma db
    const prismaUpdate = prisma.person.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        image: body.image,
        idType: body.identification?.type,
        idNumber: body.identification?.number,
        idIssueDate: body.identification?.issueDate,
        idIssuingAuthority: body.identification?.issuingAuthority,
        schedule: body.schedule,
        hourlyRatePaid: body.hourlyRatePaid ?? 0,
        hourlyRateAccrued: body.hourlyRateAccrued ?? 0,
        email: body.email,
        telegram: body.telegram,
        discord: body.discord,
        linkedin: body.linkedin,
        description: body.description,
        roles: {
          set: body.roles?.map((r) => ({ id: r.id })) ?? [],
        },
      },
    });

    // Wait for both updates to finish
    await Promise.all([notionUpdate, prismaUpdate]);
  },
);
