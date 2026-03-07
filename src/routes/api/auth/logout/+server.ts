import { clearSessionCookie } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
  clearSessionCookie(event);
  return new Response(JSON.stringify({ success: true }));
};
