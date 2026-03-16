import { handler } from "api/utils";
import { google } from "services/google-api";

export default handler(async ({ router: { driveId } }) => {
  const { stream, mimeType } = await google.drive.getStream(driveId);
  return new Response(stream, {
    headers: { "content-type": mimeType, "cache-control": "public, max-age=31536000, immutable" },
  });
});
