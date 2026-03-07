import type { RequestHandler } from "./$types";
import { getDriveFileStream } from "$lib/server/google-drive";

export const GET: RequestHandler = async ({ params }) => {
  const { stream, mimeType } = await getDriveFileStream(params.driveId);
  return new Response(stream, {
    headers: { "content-type": mimeType, "cache-control": "public, max-age=31536000, immutable" },
  });
};
