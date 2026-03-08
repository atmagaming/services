import { Client } from "@notionhq/client";
import { env } from "$env/dynamic/private";
import type { Person } from "$lib/types";

export interface NotionRole {
  notionId: string;
  name: string;
}

type PageProperties = Record<
  string,
  {
    type: string;
    title?: { plain_text: string }[];
    relation?: { id: string }[];
  }
>;

if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set");
const notion = new Client({ auth: env.NOTION_API_KEY });

export async function fetchAllRoles(): Promise<NotionRole[]> {
  const dataSourceId = env.NOTION_ROLES_DB_ID;
  if (!dataSourceId) throw new Error("NOTION_ROLES_DB_ID is not set");

  const pages: { id: string; properties: PageProperties }[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) pages.push(page as { id: string; properties: PageProperties });
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages
    .map((page) => {
      const titleProp = Object.values(page.properties).find((p) => p.type === "title");
      const name = titleProp?.title?.map((t) => t.plain_text).join("") ?? "";
      return { notionId: page.id, name };
    })
    .filter((r) => r.name);
}

// Returns Map<personNotionId, roleNotionId[]>
export async function fetchPersonRoles(): Promise<Map<string, string[]>> {
  const dataSourceId = env.NOTION_PEOPLE_DB_ID;
  if (!dataSourceId) throw new Error("NOTION_PEOPLE_DB_ID is not set");

  const pages: { id: string; properties: PageProperties }[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) pages.push(page as { id: string; properties: PageProperties });
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return new Map(pages.map((page) => [page.id, page.properties.Role?.relation?.map((r) => r.id) ?? []]));
}

let peopleDatabaseId: string | null = null;

async function getPeopleDatabaseId(): Promise<string> {
  if (peopleDatabaseId) return peopleDatabaseId;
  const dataSourceId = env.NOTION_PEOPLE_DB_ID;
  if (!dataSourceId) throw new Error("NOTION_PEOPLE_DB_ID is not set");
  const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const id = (ds.parent as { database_id?: string }).database_id ?? dataSourceId;
  peopleDatabaseId = id;
  return id;
}

export async function createPersonNotionPage(name: string, image?: string): Promise<string> {
  const databaseId = await getPeopleDatabaseId();

  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    icon: image ? { type: "external", external: { url: image } } : undefined,
    properties: {
      title: { title: [{ type: "text", text: { content: name } }] },
    },
  });

  return page.id;
}

export async function updatePersonNotion(
  notionPageId: string,
  data: { name?: string; roleNotionIds?: string[] },
): Promise<void> {
  type UpdateParams = Parameters<typeof notion.pages.update>[0];
  const update: UpdateParams = { page_id: notionPageId };
  const properties: Record<string, unknown> = {};

  if (data.name !== undefined) properties.title = { title: [{ type: "text", text: { content: data.name } }] };
  if (data.roleNotionIds !== undefined) properties.Role = { relation: data.roleNotionIds.map((id) => ({ id })) };
  if (Object.keys(properties).length > 0) update.properties = properties as UpdateParams["properties"];

  await notion.pages.update(update);
}

export async function uploadImageToNotion(filename: string, mimeType: string, buffer: Buffer): Promise<string> {
  const upload = await notion.fileUploads.create({ filename, content_type: mimeType });
  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: { filename, data: new Blob([new Uint8Array(buffer)], { type: mimeType }) },
  });
  return upload.id;
}

export async function setPersonNotionIcon(notionPageId: string, fileUploadId: string | null): Promise<void> {
  await notion.pages.update({
    page_id: notionPageId,
    icon: fileUploadId ? { type: "file_upload", file_upload: { id: fileUploadId } } : null,
  });
}

export async function syncPersonNotionPage(person: Person, status: string): Promise<void> {
  if (!person.notionPersonPageId) return;

  if (status === "working") {
    await notion.pages.update({
      page_id: person.notionPersonPageId,
      properties: {
        title: { title: [{ type: "text", text: { content: person.name } }] },
      },
    });
  } else if (status === "inactive") {
    const primaryRole = person.roles[0]?.name ?? "Team Member";
    await notion.pages.update({
      page_id: person.notionPersonPageId,
      icon: null,
      properties: {
        title: { title: [{ type: "text", text: { content: `${primaryRole} (TBH)` } }] },
      },
    });
  }
}
