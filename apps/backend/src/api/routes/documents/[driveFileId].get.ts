import { handler } from "api/utils";
import { google } from "services/google-api";

export default handler(async ({ router: { driveFileId } }) => {
  const { stream, mimeType } = await google.drive.getStream(driveFileId);
  return new Response(stream, { headers: { "content-type": mimeType, "content-disposition": "inline" } });
});
