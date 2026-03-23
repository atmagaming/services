import { Readable } from "node:stream";
import type { drive_v3 } from "googleapis";
import { DriveNode, SINGLE_FIELDS } from "./node";

export class DriveFile extends DriveNode {
  async clone(newName: string, target?: { id: string } | string): Promise<DriveFile> {
    const parentId = typeof target === "string" ? target : target?.id;
    const { data } = await this.client.files.copy({
      fileId: this.id,
      requestBody: { name: newName, parents: parentId ? [parentId] : undefined },
      supportsAllDrives: true,
      fields: SINGLE_FIELDS,
    });
    if (!data.id) throw new Error("Failed to clone file");
    return new DriveFile(data, this.client);
  }

  async download(): Promise<Buffer> {
    const response = await this.client.files.get({ fileId: this.id, alt: "media" }, { responseType: "arraybuffer" });
    return Buffer.from(response.data as unknown as ArrayBuffer);
  }

  async stream(): Promise<{ stream: ReadableStream; mimeType: string }> {
    const mimeType = this.mimeType || "application/octet-stream";
    const res = await this.client.files.get(
      { fileId: this.id, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    );
    return { stream: Readable.toWeb(res.data as unknown as Readable) as ReadableStream, mimeType };
  }

  override toXML(indent = 0): string {
    const pad = "  ".repeat(indent);
    const attrs = [`id="${this.id}"`, `name="${this.name}"`, `link="${this.link}"`];
    if (this.children.length === 0) return `${pad}<file ${attrs.join(" ")} />`;
    const childrenXml = this.children.map((c) => c.toXML(indent + 1)).join("\n");
    return `${pad}<file ${attrs.join(" ")}>\n${childrenXml}\n${pad}</file>`;
  }
}

export type { drive_v3 };
