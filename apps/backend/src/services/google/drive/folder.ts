import { Readable } from "node:stream";
import type { drive_v3 } from "googleapis";
import { DriveFile } from "./file";
import { DEFAULT_FIELDS, FOLDER_MIME, SINGLE_FIELDS } from "./node";

export class DriveFolder extends DriveFile {
  async subfolder(name: string): Promise<DriveFolder | undefined> {
    const items = await this.files();
    return items.find((f): f is DriveFolder => f instanceof DriveFolder && f.name === name);
  }

  async subfolders(): Promise<DriveFolder[]> {
    const items = await this.files();
    return items.filter((f): f is DriveFolder => f instanceof DriveFolder);
  }

  async files(): Promise<DriveFile[]> {
    const response = await this.client.files.list({
      q: `'${this.id}' in parents and trashed = false`,
      fields: `nextPageToken, ${DEFAULT_FIELDS}`,
      pageSize: 1000,
      orderBy: "folder,name",
    });
    return (response.data.files ?? []).map((f) => makeNode(f, this.client));
  }

  async createSubfolder(name: string): Promise<DriveFolder> {
    const response = await this.client.files.create({
      requestBody: { name, mimeType: FOLDER_MIME, parents: [this.id] },
      fields: SINGLE_FIELDS,
    });
    return new DriveFolder(response.data, this.client);
  }

  async upload(name: string, content: Buffer | Readable, mimeType: string): Promise<DriveFile> {
    const body = Buffer.isBuffer(content) ? Readable.from(content) : content;
    const response = await this.client.files.create({
      requestBody: { name, parents: [this.id] },
      media: { mimeType, body },
      fields: SINGLE_FIELDS,
    });
    return new DriveFile(response.data, this.client);
  }

  async ensure(name: string): Promise<DriveFolder> {
    const existing = await this.subfolder(name);
    if (existing) return existing;
    return this.createSubfolder(name);
  }

  override toXML(indent = 0): string {
    const pad = "  ".repeat(indent);
    const attrs = [`id="${this.id}"`, `name="${this.name}"`, `link="${this.link}"`];
    if (this.children.length === 0) return `${pad}<folder ${attrs.join(" ")} />`;
    const childrenXml = this.children.map((c) => c.toXML(indent + 1)).join("\n");
    return `${pad}<folder ${attrs.join(" ")}>\n${childrenXml}\n${pad}</folder>`;
  }
}

export function makeNode(data: drive_v3.Schema$File, client: drive_v3.Drive): DriveFile | DriveFolder {
  return data.mimeType === FOLDER_MIME ? new DriveFolder(data, client) : new DriveFile(data, client);
}
