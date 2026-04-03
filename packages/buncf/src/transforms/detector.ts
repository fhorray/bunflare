/**
 * Detects used Cloudflare bindings based on Bun API usage in source code.
 */
export function detectUsedBindings(source: string): Set<string> {
  const bindings = new Set<string>();

  // Detect D1 (SQLite)
  if (source.includes("new Database(") || source.includes("bun:sqlite")) {
    bindings.add("d1");
  }

  // Detect R2 (File I/O)
  if (source.includes("Bun.file(") || source.includes("Bun.write(")) {
    bindings.add("r2");
  }

  // Detect KV (Redis)
  if (source.includes("Bun.redis")) {
    bindings.add("kv");
  }

  // Detect Environment Variables
  if (source.includes("Bun.env.") || source.includes("process.env.") || source.includes("Bun.env[") || source.includes("process.env[")) {
    bindings.add("vars");
  }

  return bindings;
}
