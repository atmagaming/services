import type { RequestHandler } from "./$types";
import { getDriveFileStream } from "$lib/server/google-drive";

export const GET: RequestHandler = async ({ params }) => {
  const { stream, mimeType } = await getDriveFileStream(params.driveFileId);

  return new Response(stream, {
    headers: {
      "content-type": mimeType,
      "content-disposition": "inline",
    },
  });
};
