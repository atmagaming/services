import { Hono } from "hono";
import { getDriveFileStream } from "../services/google-drive";

const documents = new Hono();

documents.get("/:driveFileId", async (c) => {
  const { stream, mimeType } = await getDriveFileStream(c.req.param("driveFileId"));
  return new Response(stream, {
    headers: { "content-type": mimeType, "content-disposition": "inline" },
  });
});

export default documents;
