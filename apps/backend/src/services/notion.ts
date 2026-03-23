import { NotionORM } from "@notion/client";
import { env } from "env";

export const notion = new NotionORM(env.NOTION_API_KEY);
