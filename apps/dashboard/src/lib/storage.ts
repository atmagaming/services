/**
 * Typed localStorage proxy.
 *
 * - `undefined` → key does not exist (removes from storage on set)
 * - `null` → key exists but is empty (stored as JSON `"null"`)
 */
function typedStorage<T extends Record<string, unknown>>() {
  return new Proxy({} as { [K in keyof T]: T[K] | undefined }, {
    get(_, key: string) {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      return JSON.parse(raw);
    },
    set(_, key: string, value) {
      if (value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
      return true;
    },
  });
}

export const ls = typedStorage<{
  authToken: string | null;
}>();
