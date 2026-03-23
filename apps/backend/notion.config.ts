import type { NotionConfigType } from "@elumixor/notion-orm";

export default {
  auth: process.env.NOTION_API_KEY ?? "",
  databases: {
    tasks: process.env.NOTION_TASKS_DB_ID ?? "",
    people: process.env.NOTION_PEOPLE_DB_ID ?? "",
  },
} satisfies NotionConfigType;
