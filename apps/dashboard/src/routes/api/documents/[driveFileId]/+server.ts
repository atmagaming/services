import { getDriveFileStream } from "$lib/server/google-drive";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const { stream, mimeType } = await getDriveFileStream(params.driveFileId);

  return new Response(stream, {
    headers: {
      "content-type": mimeType,
      "content-disposition": "inline",
    },
  });
};
