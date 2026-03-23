import { google } from "services/google";
import { defineTool } from "streaming-agent";
import { z } from "zod";

export const listFolderTool = defineTool(
  "ListFolder",
  "List files and folders inside a folder on user's Google Drive. Returns detailed info including IDs, names, types, sizes",
  z.object({
    folderId: z
      .string()
      .nullable()
      .describe("Folder ID to list contents of. If null, lists the contents of the root folder"),
  }),
  async ({ folderId }) => {
    const items = folderId
      ? await (await google.drive.folder(folderId)).files()
      : await google.drive.rootFolders();
    return items.map((f) => f.toXML()).join("\n");
  },
);
