import { handler } from "api/utils";
import { requirePermission } from "services/auth";
import { ensurePersonalFolder } from "services/people";

export default handler({}, async ({ user, router: { id } }) => {
  requirePermission(user, "canEditPeople");
  const driveFolderId = await ensurePersonalFolder(id);
  return { driveFolderId };
});
