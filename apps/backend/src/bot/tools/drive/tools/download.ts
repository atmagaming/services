import { google } from "services/google";
import { defineTool } from "streaming-agent";
import { saveTempFile } from "utils/files";
import { z } from "zod";

export const downloadFileTool = defineTool(
  "DownloadFile",
  "Download a file from Google Drive and store it temporarily. Returns a path to the downloaded file",
  z.object({
    fileId: z.string().describe("ID of the file to download"),
    filename: z.string().nullable().describe("Filename, or null (defaults to document name)"),
  }),
  async ({ fileId, filename }) => {
    const file = await google.drive.file(fileId);
    const fileName = filename ?? file.name;
    const mimeType = file.mimeType;

    const fileBuffer = await file.download();
    const extension = getExtension(fileName, mimeType);
    const tempPath = await saveTempFile(fileBuffer, extension, fileName);

    return tempPath;
  },
);

function getExtension(fileName: string, mimeType: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex !== -1) return fileName.slice(dotIndex + 1);
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "txt";
  if (mimeType === "application/json") return "json";
  return "bin";
}
