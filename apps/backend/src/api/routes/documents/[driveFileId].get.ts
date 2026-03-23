import { handler } from "api/utils";
import { google } from "services/google";

export default handler(async ({ router: { driveFileId } }) => {
  const { stream, mimeType } = await (await google.drive.file(driveFileId)).stream();
  return new Response(stream, { headers: { "content-type": mimeType, "content-disposition": "inline" } });
});
