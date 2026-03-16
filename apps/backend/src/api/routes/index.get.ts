import { handler } from "api/utils";

// Health check
export default handler(() => ({ status: "ok" }));
