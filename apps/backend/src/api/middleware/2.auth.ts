import { defineEventHandler, getHeader } from "h3";
import { verifyJWT } from "services/auth";

export default defineEventHandler((event) => {
  const header = getHeader(event, "authorization");
  event.context.user = header?.startsWith("Bearer ") ? verifyJWT(header.slice(7)) : null;
});
