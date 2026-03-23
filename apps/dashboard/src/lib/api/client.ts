import { NitroAPI } from "@atma/backend";
import { ls } from "$lib/storage";

export const api = new NitroAPI({
  baseUrl: (import.meta.env.VITE_API_URL as string).replace(/\/+$/, ""),
  async fetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    if (ls.authToken) headers.set("Authorization", `Bearer ${ls.authToken}`);
    const res = await fetch(input, { ...init, headers });
    if (res.status === 401) ls.authToken = undefined;
    return res;
  },
});
