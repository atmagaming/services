import { google } from "services/google";
import { defineTool } from "streaming-agent";
import { z } from "zod";

export const renameTool = defineTool(
  "Rename",
  "Rename a file or folder in Google Drive.",
  z.object({
    fileId: z.string().describe("The ID of the file or folder to rename"),
    newName: z.string().describe("The new name for the file or folder"),
  }),
  async ({ fileId, newName }) => {
    const file = await google.drive.file(fileId);
    await file.rename(newName);
    return `Renamed "${file.name}" to "${newName}"`;
  },
);
