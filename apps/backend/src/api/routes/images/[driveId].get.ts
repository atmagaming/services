import { handler } from "api/utils";
import { google } from "services/google";

export default handler(async ({ router: { driveId } }) => {
  const { stream, mimeType } = await (await google.drive.file(driveId)).stream();
  return new Response(stream, {
    headers: { "content-type": mimeType, "cache-control": "public, max-age=31536000, immutable" },
  });
});
