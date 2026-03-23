import type { docs_v1, drive_v3 } from "googleapis";
import { google } from "googleapis";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export class DocsApi {
  private readonly docsClient: docs_v1.Docs;
  private readonly driveClient: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.docsClient = google.docs({ version: "v1", auth });
    this.driveClient = google.drive({ version: "v3", auth });
  }

  async getDocument(documentId: string) {
    const response = await this.docsClient.documents.get({ documentId });
    return response.data;
  }

  async batchUpdate(documentId: string, requests: docs_v1.Schema$Request[]) {
    await this.docsClient.documents.batchUpdate({ documentId, requestBody: { requests } });
  }

  async replaceText(documentId: string, replacements: Record<string, string>): Promise<void> {
    const requests = Object.entries(replacements).map(([find, replace]) => ({
      replaceAllText: { containsText: { text: find, matchCase: true }, replaceText: replace },
    }));
    await this.batchUpdate(documentId, requests);
  }

  async exportPdf(documentId: string): Promise<Buffer> {
    const response = await this.driveClient.files.export(
      { fileId: documentId, mimeType: "application/pdf" },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(response.data as ArrayBuffer);
  }
}
