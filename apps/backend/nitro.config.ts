import { resolve } from "node:path";
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "bun",
  srcDir: "src/api",
  compatibilityDate: "2025-01-01",
  alias: {
    env: resolve("./src/env"),
    "@prisma/client": resolve("./generated/prisma/client"),
    services: resolve("./src/services"),
    api: resolve("./src/api"),
  },
  rollupConfig: {
    plugins: [
      {
        name: "externalize-prisma",
        resolveId(id: string) {
          if (id === "@prisma/client" || id.startsWith("@prisma/")) return { id, external: true };
        },
      },
    ],
  },
});
