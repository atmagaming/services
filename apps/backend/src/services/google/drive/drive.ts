import type { drive_v3 } from "googleapis";
import { google } from "googleapis";
import { DriveFile } from "./file";
import { DriveFolder, makeNode } from "./folder";
import { globToQuery } from "./glob-query";
import { DEFAULT_FIELDS, FOLDER_MIME, SINGLE_FIELDS } from "./node";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

const MAX_PAGE_SIZE = 1000;

export class Drive {
  private readonly client: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.client = google.drive({ version: "v3", auth });
  }

  async rootFolders(): Promise<DriveFolder[]> {
    const items = await this.listItems(`sharedWithMe = true and trashed = false`);
    return items.filter((f): f is DriveFolder => f instanceof DriveFolder);
  }

  async folder(id: string): Promise<DriveFolder> {
    const response = await this.client.files.get({ fileId: id, fields: SINGLE_FIELDS });
    return new DriveFolder(response.data, this.client);
  }

  async file(id: string): Promise<DriveFile> {
    const response = await this.client.files.get({ fileId: id, fields: SINGLE_FIELDS });
    return makeNode(response.data, this.client);
  }

  async search(pattern: string, maxResults = 100): Promise<Array<DriveFile | DriveFolder>> {
    const { query, filter } = globToQuery(pattern);
    const q = query ? `trashed = false and ${query}` : "trashed = false";
    const items = await this.listItems(q, maxResults);
    return items.filter((f) => filter(f.name));
  }

  async tree(folderId?: string, depth = 3, showFiles = true): Promise<Array<DriveFile | DriveFolder>> {
    depth = Math.min(depth, 10);

    let rootItems: Array<DriveFile | DriveFolder>;
    if (folderId) {
      const folder = await this.folder(folderId);
      rootItems = await folder.files();
    } else {
      const mimeFilter = showFiles ? "" : ` and mimeType = '${FOLDER_MIME}'`;
      rootItems = await this.listItems(`sharedWithMe = true and trashed = false${mimeFilter}`);
    }

    if (!showFiles && folderId) rootItems = rootItems.filter((f) => f instanceof DriveFolder);

    const root = sortNodes(rootItems);
    let currentLevel = root.filter((n): n is DriveFolder => n instanceof DriveFolder);
    let currentDepth = 1;

    while (currentLevel.length > 0 && currentDepth <= depth) {
      const entries = await Promise.all(currentLevel.map(async (f) => ({ folder: f, children: await f.files() })));
      const nextLevel: DriveFolder[] = [];

      for (const { folder, children } of entries) {
        const filtered = showFiles ? children : children.filter((f) => f instanceof DriveFolder);
        const sorted = sortNodes(filtered);
        folder.children.push(...sorted);
        for (const child of sorted) if (child instanceof DriveFolder) nextLevel.push(child);
      }

      currentLevel = nextLevel;
      currentDepth++;
    }

    return root;
  }

  private async listItems(query: string, maxResults = MAX_PAGE_SIZE): Promise<Array<DriveFile | DriveFolder>> {
    const pageSize = Math.min(maxResults, MAX_PAGE_SIZE);
    const files: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.client.files.list({
        q: query,
        fields: `nextPageToken, ${DEFAULT_FIELDS}`,
        pageSize: Math.min(pageSize, maxResults - files.length),
        orderBy: "folder,name",
        pageToken,
      });

      files.push(...(response.data.files ?? []));
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken && files.length < maxResults);

    return files.map((f) => makeNode(f, this.client));
  }
}

function sortNodes(nodes: Array<DriveFile | DriveFolder>): Array<DriveFile | DriveFolder> {
  return nodes.sort((a, b) => {
    if (a instanceof DriveFolder && !(b instanceof DriveFolder)) return -1;
    if (!(a instanceof DriveFolder) && b instanceof DriveFolder) return 1;
    return a.name.localeCompare(b.name);
  });
}
