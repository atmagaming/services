import { defineTask } from "nitropack/runtime";
import { google } from "services/google";

// Runs monthly to keep the Google OAuth refresh token alive.
// Tokens expire after 6 months of inactivity in production mode.
export default defineTask({
  meta: { name: "keep-google-token-alive", description: "Keep Google OAuth token active" },
  async run() {
    await google.drive.rootFolders();
    return { result: "ok" };
  },
});
