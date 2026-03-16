import { handler } from "api/utils";
import { env } from "env";
import { google } from "googleapis";
import { createError, sendRedirect } from "h3";
import { createJWT } from "services/auth";
import { prisma } from "services/prisma";
import z from "zod";

export default handler({ query: { code: z.string() } }, async ({ event, query: { code } }) => {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI,
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.email) throw createError({ statusCode: 400, statusMessage: "No email returned from Google" });

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name ?? null, image: data.picture ?? null },
    create: { email: data.email, name: data.name ?? null, image: data.picture ?? null },
  });

  const token = await createJWT(user);

  return sendRedirect(event, `${env.PUBLIC_AUTH_URL}/login?token=${token}`);
});
