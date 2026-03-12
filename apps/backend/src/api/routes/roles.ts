import { Hono } from "hono";
import { getNotionRoles } from "../cache";

const roles = new Hono();

roles.get("/", async (c) => {
  const rolesMap = await getNotionRoles();
  const rolesList = Array.from(rolesMap, ([notionId, name]) => ({ notionId, name }));
  return c.json({ roles: rolesList });
});

export default roles;
