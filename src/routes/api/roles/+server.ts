import { getNotionRoles } from "$lib/server/data";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const rolesMap = await getNotionRoles();
  const roles = Array.from(rolesMap, ([notionId, name]) => ({ notionId, name }));
  return new Response(JSON.stringify({ roles }), { headers: { "content-type": "application/json" } });
};
