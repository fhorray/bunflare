/**
 * Hyperdrive Logic for Bun.sql
 * This code runs INSIDE the Cloudflare Worker.
 * It maps Bun.sql tagged templates to a postgres.js client.
 */

interface SQLClient {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  unsafe(query: string): Promise<unknown>;
}

interface PGClient {
  connect(): Promise<void>;
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
}

export function createSQL(bindingName: string, driver: "postgres" | "pg" | "mysql2" = "postgres") {

  async function executeQuery(queryFn: (client: any) => Promise<any>) {
    const env = (globalThis as any).__BUNFLARE_TEST_ENV__ || (globalThis as any).Bun?.env;
    const hyperdrive = env?.[bindingName] as { connectionString: string } | undefined;

    if (!hyperdrive || !hyperdrive.connectionString) {
      throw new Error(`[bunflare] Hyperdrive binding "${bindingName}" not found in Bun.env`);
    }

    if (driver === "postgres") {
      // @ts-ignore
      const { default: postgres } = await import("postgres");
      // Create a single-connection client per query. Hyperdrive handles the actual pooling.
      const client = postgres(hyperdrive.connectionString, {
        max: 1,
        onnotice: () => { } // Silences noisy PostgreSQL notices like "relation already exists"
      });
      try {
        return await queryFn(client);
      } finally {
        await client.end();
      }
    } else if (driver === "pg") {
      // @ts-ignore
      const { Client } = await import("pg");
      const client = new Client({ connectionString: hyperdrive.connectionString });
      await client.connect();
      try {
        return await queryFn(client);
      } finally {
        await client.end();
      }
    } else {
      throw new Error(`[bunflare] Driver "${driver}" for Hyperdrive is not yet implemented in Bun.sql shim.`);
    }
  }

  /**
   * The sql tagged template literal.
   * Matches Bun's Bun.sql API.
   */
  function sql(strings: TemplateStringsArray, ...values: unknown[]) {
    const execute = async () => {
      return executeQuery(async (client) => {
        if (driver === "postgres") {
          return await client(strings, ...values);
        }

        if (driver === "pg") {
          let queryText = strings[0] || "";
          for (let i = 1; i < strings.length; i++) {
            queryText += `$${i}${strings[i] || ""}`;
          }
          const res = await client.query(queryText, values);
          return res.rows;
        }
      });
    };

    const promise = execute();

    return {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      async values() {
        const results = await promise as Record<string, unknown>[];
        if (!results || results.length === 0) return [];
        const keys = Object.keys(results[0] as Record<string, unknown>);
        return results.map(row => keys.map(k => row[k]));
      }
    };
  }

  // Expose unsafe for raw queries
  const unsafe = async (str: string) => {
    return executeQuery(async (client) => {
      if (driver === "postgres") return await client.unsafe(str);
      if (driver === "pg") {
        const res = await client.query(str);
        return res.rows;
      }
    });
  };

  (sql as any).unsafe = unsafe;

  return sql as typeof sql & { unsafe: typeof unsafe };
}
