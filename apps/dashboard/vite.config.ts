import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  if (!env.VITE_API_URL) throw new Error("VITE_API_URL is required");

  return { plugins: [tailwindcss(), sveltekit(), devtoolsJson()] };
});
