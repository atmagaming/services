import { Hono } from "hono";
import { getUser } from "../auth";
import { superAdminEmails } from "../env";
import { prisma } from "../prisma";

const admin = new Hono();

admin.get("/", async (c) => {
  const user = getUser(c);
  if (!user?.isSuperAdmin) return c.json({ message: "Forbidden" }, 403);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      canViewTransactions: true,
      canViewRevenueShares: true,
      canViewPersonalData: true,
      canEditPeople: true,
    },
  });

  return c.json({ users, superAdminEmails });
});

admin.post("/", async (c) => {
  const user = getUser(c);
  if (!user?.email || !superAdminEmails.includes(user.email))
    return c.json({ message: "Only super-admin can manage permissions" }, 403);

  const { email, permission, value } = await c.req.json<{ email?: string; permission?: string; value?: boolean }>();

  if (!email || !permission || value === undefined)
    return c.json({ message: "email, permission and value are required" }, 400);

  const allowed = ["canViewTransactions", "canViewRevenueShares", "canViewPersonalData", "canEditPeople"];
  if (!allowed.includes(permission)) return c.json({ message: "Invalid permission" }, 400);

  await prisma.user.upsert({
    where: { email },
    update: { [permission]: value },
    create: { email, [permission]: value },
  });

  return c.json({ success: true });
});

admin.delete("/", async (c) => {
  const user = getUser(c);
  if (!user?.email || !superAdminEmails.includes(user.email))
    return c.json({ message: "Only super-admin can remove permissions" }, 403);

  const { email } = await c.req.json<{ email?: string }>();
  if (!email) return c.json({ message: "Email is required" }, 400);
  if (superAdminEmails.includes(email)) return c.json({ message: "Cannot remove super-admin permissions" }, 400);

  await prisma.user.update({
    where: { email },
    data: { canViewTransactions: false, canViewRevenueShares: false, canViewPersonalData: false, canEditPeople: false },
  });

  return c.json({ success: true });
});

export default admin;
