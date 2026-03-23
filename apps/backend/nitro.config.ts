import { resolve } from "node:path";
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "bun",
  srcDir: "src/api",
  compatibilityDate: "2025-01-01",
  moduleSideEffects: ["@elumixor/extensions"],
  alias: {
    env: resolve("./src/env"),
    "@prisma/client": resolve("./generated/prisma/client"),
    "@notion/client": resolve("./generated/notion-orm"),
    services: resolve("./src/services"),
    api: resolve("./src/api"),
  },
  experimental: {
    tasks: true,
  },
  scheduledTasks: {
    "0 0 1 * *": ["keep-google-token-alive"], // 1st of every month
  },
  rollupConfig: {
    plugins: [
      {
        name: "prisma-subpath-external",
        resolveId(id: string) {
          if (id.startsWith("@prisma/client/")) return { id, external: true };
        },
      },
    ],
  },
});
