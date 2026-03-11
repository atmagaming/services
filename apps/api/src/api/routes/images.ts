import { Hono } from "hono";
import { getDriveFileStream } from "../google-drive";

const images = new Hono();

images.get("/:driveId", async (c) => {
  const { stream, mimeType } = await getDriveFileStream(c.req.param("driveId"));
  return new Response(stream, {
    headers: { "content-type": mimeType, "cache-control": "public, max-age=31536000, immutable" },
  });
});

export default images;
