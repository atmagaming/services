import { Client } from "@notionhq/client";
import { env } from "$env/dynamic/private";
import type { Person } from "$lib/types";

export interface NotionRole {
  notionId: string;
  name: string;
}

type PageProperties = Record<string, {
  type: string;
  title?: { plain_text: string }[];
  relation?: { id: string }[];
}>;

function getClient() {
  const auth = env.NOTION_API_KEY;
  if (!auth) throw new Error("NOTION_API_KEY is not set");
  return new Client({ auth });
}

export async function fetchAllRoles(): Promise<NotionRole[]> {
  const dataSourceId = env.NOTION_ROLES_DB_ID;
  if (!dataSourceId) throw new Error("NOTION_ROLES_DB_ID is not set");

  const notion = getClient();
  const pages: { id: string; properties: PageProperties }[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    for (const page of res.results)
      pages.push(page as { id: string; properties: PageProperties });
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

  const notion = getClient();
  const pages: { id: string; properties: PageProperties }[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    for (const page of res.results)
      pages.push(page as { id: string; properties: PageProperties });
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return new Map(
    pages.map((page) => [page.id, page.properties["Role"]?.relation?.map((r) => r.id) ?? []])
  );
}

export async function syncPersonNotionPage(person: Person, status: string): Promise<void> {
  if (!person.notionPersonPageId) return;

  const notion = getClient();

  if (status === "working") {
    await notion.pages.update({
      page_id: person.notionPersonPageId,
      icon: person.image ? { type: "external", external: { url: person.image } } : null,
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
