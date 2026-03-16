import { handler } from "api/utils";
import { env } from "env";
import { google } from "googleapis";
import { sendRedirect } from "h3";

export default handler(({ event }) => {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI,
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  return sendRedirect(event, url);
});
