/**
 * Translates a glob pattern into a Google Drive API query fragment
 * and a local post-filter, since Google only supports `name contains` / `name =`.
 */
export function globToQuery(pattern: string) {
  const name = pattern.replace(/^\*\*\//, "");

  if (!name.includes("*") && !name.includes("?")) {
    const escaped = name.replace(/'/g, "\\'");
    return { query: `name = '${escaped}'`, filter: (n: string) => n.toLowerCase() === name.toLowerCase() };
  }

  const literals = name.split(/[*?]+/).filter(Boolean);
  const query = literals.map((lit) => `name contains '${lit.replace(/'/g, "\\'")}'`).join(" and ");

  const filter = globToFilter(name);
  return { query, filter };
}

function globToFilter(glob: string): (name: string) => boolean {
  let regex = "^";
  for (const ch of glob) {
    if (ch === "*") regex += ".*";
    else if (ch === "?") regex += ".";
    else regex += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  regex += "$";
  const re = new RegExp(regex, "i");
  return (name) => re.test(name);
}
