import { fetchAllRoles } from "./services/notion";

const CACHE_TTL = 300_000; // 5 minutes

let notionRolesPromise: Promise<Map<string, string>> | null = null;

export function getNotionRoles(): Promise<Map<string, string>> {
  notionRolesPromise ??= fetchAllRoles()
    .then((roles) => new Map(roles.map((r) => [r.notionId, r.name])))
    .catch((e) => {
      console.error(`Failed to load Notion roles: ${(e as Error).message}`);
      return new Map<string, string>();
    });
  return notionRolesPromise;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}
