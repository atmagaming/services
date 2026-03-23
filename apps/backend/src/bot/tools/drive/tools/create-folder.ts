import { google } from "services/google";
import { defineTool } from "streaming-agent";
import { z } from "zod";

export const createFolderTool = defineTool(
  "CreateFolder",
  "Create a new folder in Google Drive inside a specified parent folder.",
  z.object({
    name: z.string().describe("The name of the folder to create"),
    parent_folder_id: z.string().describe("The ID of the parent folder (must be shared with the bot)"),
  }),
  async ({ name, parent_folder_id }) => {
    const parent = await google.drive.folder(parent_folder_id);
    const folder = await parent.createSubfolder(name);
    return folder.toXML();
  },
);
