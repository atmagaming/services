import "@elumixor/extensions";
import type { Handle } from "@sveltejs/kit";
import { getSessionUser } from "$lib/server/auth";
import { logRequest, logError } from "$lib/server/logger";

export const handle: Handle = async ({ event, resolve }) => {
  try {
    event.locals.user = getSessionUser(event);
  } catch (e) {
    console.error("Session parsing failed:", e);
    logError(`Session parsing failed: ${e instanceof Error ? e.message : String(e)}`);
    event.locals.user = null;
  }

  const startTime = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - startTime;

  await logRequest(event.request.method, event.url.pathname, response.status, duration);

  return response;
};
