/**
 * Transforms bun:sqlite usage to be asynchronous for Cloudflare D1.
 * Example: `db.query(...).all()` -> `await db.query(...).all()`
 */
export function transformSqlite(source: string): string {
  if (!source.includes(".query(") && !source.includes(".exec(")) {
    return source;
  }

  // Regex to find .query(...).all(), .get(), .run(), .values()
  // and prefix them with await if they aren't already.
  // We use word boundaries \b to ensure we match the full object name.
  const queryMethods = ["all", "get", "run", "values"];
  let transformed = source;

  for (const method of queryMethods) {
    // Replace Bun.query or db.query (with or without await)
    // Always ensure it's awaited if it's one of these methods
    const regex = new RegExp(`(?:await\\s+)?\\b([a-zA-Z0-9_\\.]+)\\.query\\(.*?\\)\\.${method}\\(`, "g");
    transformed = transformed.replace(regex, (match) => match.startsWith("await") ? match : `await ${match}`);
  }

  // Also handle .exec()
  const execRegex = /(?:await\s+)?\b([a-zA-Z0-9_\.]+)\.exec\(/g;
  transformed = transformed.replace(execRegex, (match) => match.startsWith("await") ? match : `await ${match}`);

  return transformed;
}
