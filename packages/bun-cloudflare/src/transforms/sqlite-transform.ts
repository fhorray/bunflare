/**
 * Regex to find .query(...).all(), .get(), .run(), .values(), or .exec()
 * and prefix them with await if they aren't already.
 * We use word boundaries \b to ensure we match the full object name.
 */
const SQLITE_QUERY_REGEX = /(?:await\s+)?\b[a-zA-Z0-9_\.]+\.(?:query\(.*?\)\.(?:all|get|run|values)|exec)\(/g;

/**
 * Transforms bun:sqlite usage to be asynchronous for Cloudflare D1.
 * Example: `db.query(...).all()` -> `await db.query(...).all()`
 */
export function transformSqlite(source: string): string {
  if (!source.includes(".query(") && !source.includes(".exec(")) {
    return source;
  }

  return source.replace(SQLITE_QUERY_REGEX, (match) => (match.startsWith("await") ? match : `await ${match}`));
}
