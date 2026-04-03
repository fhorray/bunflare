import { getBunCloudflareContext } from "../runtime/context";
import type { CloudflareEnv } from "../types";
import type { D1Database, D1Result } from "@cloudflare/workers-types";

/**
 * Partial shim for Bun's Database (bun:sqlite).
 * Note: D1 is asynchronous, while bun:sqlite is synchronous.
 */
export class Database {
  private bindingName: string;

  constructor(filename: string) {
    // In Workers, the filename is used as the binding name or defaults to 'DB'
    this.bindingName = filename === ":memory:" ? "DB" : filename;
  }

  private getDB(): D1Database {
    const { env } = getBunCloudflareContext<CloudflareEnv & Record<string, unknown>>();
    const db = env[this.bindingName];
    if (!db || typeof (db as D1Database).prepare !== "function") {
      throw new Error(`[bun-cloudflare] D1 binding "${this.bindingName}" not found in env.`);
    }
    return db as D1Database;
  }

  query(sql: string) {
    const db = this.getDB();
    return {
      all: async (...params: unknown[]) => {
        const stmt = db.prepare(sql);
        return (await stmt.bind(...params).all()).results;
      },
      get: async (...params: unknown[]) => {
        const stmt = db.prepare(sql);
        return await stmt.bind(...params).first();
      },
      run: async (...params: unknown[]) => {
        const stmt = db.prepare(sql);
        return await stmt.bind(...params).run();
      },
      values: async (...params: unknown[]) => {
        const stmt = db.prepare(sql);
        return (await stmt.bind(...params).raw());
      }
    };
  }

  async run(sql: string, ...params: unknown[]) {
    const stmt = this.getDB().prepare(sql);
    return await stmt.bind(...params).run();
  }

  async exec(sql: string) {
    return await this.getDB().exec(sql);
  }
}
