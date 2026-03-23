import type { drive_v3 } from "googleapis";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const DEFAULT_FIELDS = "files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink)";
export const SINGLE_FIELDS = DEFAULT_FIELDS.replace("files(", "").replace(")", "");

export class DriveNode {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly link: string;
  children: DriveNode[] = [];

  constructor(
    data: drive_v3.Schema$File,
    protected readonly client: drive_v3.Drive,
  ) {
    this.id = data.id ?? "";
    this.name = data.name ?? "Untitled";
    this.mimeType = data.mimeType ?? "";
    this.link = data.webViewLink ?? `https://drive.google.com/open?id=${this.id}`;
  }

  async rename(newName: string): Promise<void> {
    await this.client.files.update({ fileId: this.id, requestBody: { name: newName } });
  }

  async delete(): Promise<void> {
    await this.client.files.delete({ fileId: this.id });
  }

  toXML(indent = 0): string {
    const pad = "  ".repeat(indent);
    const attrs = [`id="${this.id}"`, `name="${this.name}"`, `link="${this.link}"`];
    if (this.children.length === 0) return `${pad}<file ${attrs.join(" ")} />`;
    const childrenXml = this.children.map((c) => c.toXML(indent + 1)).join("\n");
    return `${pad}<file ${attrs.join(" ")}>\n${childrenXml}\n${pad}</file>`;
  }
}
