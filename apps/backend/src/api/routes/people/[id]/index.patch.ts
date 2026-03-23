import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { google } from "services/google";
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
          type: z.enum(IdType).nullable(),
          number: z.string().nullable(),
          issueDate: z.string().nullable(),
          issuingAuthority: z.string().nullable(),
        })
        .partial()
        .optional(),
      schedule: z.string().regex(/^(\d+,){6}\d+$/).optional(),
      paidHourly: z.number().optional(),
      accruedHourly: z.number().optional(),
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
  async ({ user, body: { roles, identification, ...body }, router: { id } }) => {
    requirePermission(user, "canEditPeople");

    // In notion only update name, roles, icon
    const notionUpdate = notion.people.update({
      where: { id },
      data: {
        name: body.name,
        role: roles?.map(r => r.id)
      },
      $icon: body.image,
    });

    // Update main prisma db
    const prismaUpdate = prisma.person.update({
      where: { id },
      data: {
        ...body,
        ...(identification && {
          idType: identification.type,
          idNumber: identification.number,
          idIssueDate: identification.issueDate ? new Date(identification.issueDate) : undefined,
          idIssuingAuthority: identification.issuingAuthority,
        }),
        roles: {
          set: roles?.map((r) => ({ id: r.id })) ?? [],
        },
      },
    });

    // If name changed and person has a Drive folder, rename it in parallel (non-blocking)
    if (body.name) {
      prisma.person
        .findUnique({ where: { id }, select: { driveFolderId: true } })
        .then(async (p) => {
          if (p?.driveFolderId) {
            const folder = await google.drive.folder(p.driveFolderId);
            await folder.rename(body.name!);
          }
        })
        .catch((e: Error) => console.error(`Failed to rename Drive folder for person ${id}: ${e.message}`));
    }

    // Wait for both updates to finish
    await Promise.all([notionUpdate, prismaUpdate]);
  },
);
