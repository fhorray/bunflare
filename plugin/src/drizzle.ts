import { drizzle as sqliteDrizzle } from "drizzle-orm/sqlite-proxy";

/**
 * Type definitions for Bun's SQL engine
 */
interface BunSQLQueryResult {
  run(): Promise<void>;
  values(): Promise<unknown[][]>;
}

interface BunSQLTag {
  (strings: string | TemplateStringsArray, ...values: unknown[]): BunSQLQueryResult;
  unsafe(sql: string, params?: unknown[]): BunSQLQueryResult;
}

interface GlobalBun {
  Bun?: {
    sql: BunSQLTag;
  };
}

/**
 * Universal Bunflare Adapter for Drizzle ORM.
 * 
 * This adapter simplifies Drizzle usage with Bun.sql and Cloudflare D1.
 * It supports both single queries and batch operations, ensuring 
 * full compatibility with Drizzle Relational Queries and performance optimizations.
 * 
 * @example
 * import { drizzle } from "bunflare/drizzle";
 * import * as schema from "./schema";
 * 
 * export const db = drizzle({ schema });
 */
export function drizzle<TSchema extends Record<string, unknown>>(
  options: { schema?: TSchema; client?: BunSQLTag } = {}
) {
  const bunSql = options.client || (globalThis as unknown as GlobalBun).Bun?.sql;

  /**
   * Single Query Execution Logic
   */
  const executeQuery = async (sql: string, params: unknown[], method: 'run' | 'all' | 'get' | 'values') => {
    try {
      if (!bunSql) {
        throw new Error("[bunflare/drizzle] No SQL client found. Ensure Bun.sql is available or pass a 'client' to drizzle().");
      }

      const query = bunSql.unsafe(sql, params as unknown[]);
      
      if (method === "run") {
        await query.run();
        return { rows: [] };
      }

      const rows = await query.values();
      return { rows };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[bunflare/drizzle] Query Error:", message);
      throw e;
    }
  };

  /**
   * Batch Query Execution Logic
   */
  const executeBatch = async (
    queries: {
      sql: string;
      params: any[];
      method: 'all' | 'run' | 'get' | 'values';
    }[]
  ) => {
    try {
      if (!bunSql) {
        throw new Error("[bunflare/drizzle] No SQL client found for batch execution.");
      }

      // We execute queries. In production (D1), the Bunflare shim 
      // can optimize this if the D1 binding supports batch.
      // For now, we process them and return the expected Drizzle format.
      const results = await Promise.all(
        queries.map(async (q) => {
          const query = bunSql.unsafe(q.sql, q.params);
          if (q.method === "run") {
            await query.run();
            return { rows: [] };
          }
          const rows = await query.values();
          return { rows };
        })
      );

      return results;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[bunflare/drizzle] Batch Error:", message);
      throw e;
    }
  };

  return sqliteDrizzle(executeQuery, executeBatch, options);
}
