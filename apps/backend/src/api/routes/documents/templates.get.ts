import { handler } from "api/utils";
import { env } from "env";
import { createError } from "h3";

export default handler(({ user }) => {
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (!user.canEditPeople) throw createError({ statusCode: 403, statusMessage: "Forbidden" });

  return {
    ndaTemplateUrl: `https://docs.google.com/document/d/${env.GOOGLE_DRIVE_NDA_TEMPLATE_ID}`,
    contractTemplateUrl: `https://docs.google.com/document/d/${env.GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID}`,
  };
});
