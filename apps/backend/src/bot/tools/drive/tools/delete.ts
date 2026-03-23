import { google } from "services/google";
import { defineTool } from "streaming-agent";
import { z } from "zod";

export const deleteFileTool = defineTool(
  "DeleteFile",
  "Move a file or folder to trash in Google Drive. Can be recovered from trash.",
  z.object({
    file_id: z.string().describe("The ID of the file or folder to delete"),
  }),
  async ({ file_id }) => {
    const file = await google.drive.file(file_id);
    await file.delete();
    return `Deleted: ${file.name}`;
  },
);
