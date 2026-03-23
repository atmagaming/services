import NotionORM from "@elumixor/notion-orm";
import { env } from "env";

export { escapeXML, NotionAPI, notion } from "./notion-api";
export { NotionDatabase } from "./notion-database";
export { NotionPage } from "./notion-page";
export type { TaskFilter } from "./notion-task-filter";
export { buildTaskFilter } from "./notion-task-filter";
export type { NotionProperty, PropertySchema, RichTextItem } from "./types";

export const orm = new NotionORM({ auth: env.NOTION_API_KEY });
