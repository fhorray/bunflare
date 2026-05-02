/**
 * Universal SQL Shim Logic (D1 + Hyperdrive)
 */

export interface D1Binding {
  prepare(query: string): {
    bind(...params: unknown[]): {
      all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
      run(): Promise<{ success: boolean; error?: string }>;
    };
  };
}

export interface HyperdriveBinding {
  connectionString: string;
}

export interface BunflareEnv {
  [key: string]: D1Binding | HyperdriveBinding | unknown;
}

/**
 * The core query logic that handles both D1 and Hyperdrive.
 */
export class SQLQuery<T = unknown[]> {
  constructor(
    public bindingName: string, 
    public text: string, 
    public params: unknown[],
    public driver: string = "postgres",
    public strings?: string[] | TemplateStringsArray,
    public templateValues?: unknown[]
  ) {}

  private getEnv(): BunflareEnv | undefined {
    return (globalThis as any).__BUNFLARE_TEST_ENV__ || (globalThis as any).Bun?.env;
  }

  private async getBinding(): Promise<D1Binding | HyperdriveBinding> {
    const env = this.getEnv();
    if (!env) {
      throw new Error(`[bunflare] Environment not initialized. Cannot access binding "${this.bindingName}".`);
    }
    const binding = env[this.bindingName] as D1Binding | HyperdriveBinding;
    if (!binding) {
      throw new Error(`[bunflare] Binding "${this.bindingName}" not found.`);
    }
    return binding;
  }

  async execute(): Promise<T> {
    const binding = await this.getBinding();
    
    // 1. Detect D1 (SQLite)
    if ("prepare" in binding && typeof binding.prepare === "function") {
      const res = await binding.prepare(this.text).bind(...this.params).all<any>();
      return res.results as unknown as T;
    } 
    
    // 2. Detect Hyperdrive (Postgres)
    if ("connectionString" in binding && binding.connectionString) {
      // 2. Hyperdrive / Postgres logic
      const driver = this.driver || "postgres";

      if (driver === "pg") {
        const pgModule = ["p", "g"].join("");
        const { Client } = await import(pgModule);
        const client = new Client({ connectionString: binding.connectionString });
        await client.connect();
        try {
          // Translate ? to $1, $2, etc.
          let count = 0;
          const pgText = this.text.replace(/\?/g, () => `\$${++count}`);
          const res = await client.query(pgText, this.params);
          return res.rows as unknown as T;
        } finally {
          await client.end();
        }
      }

      // Default: postgres.js
      const pgName = ["post", "gres"].join("");
      const { default: postgres } = await import(pgName);
      
      // Use a persistent client if possible to avoid connection churn
      const client = (globalThis as any)._sql_clients?.[binding.connectionString] || 
                    postgres(binding.connectionString, { max: 1, onnotice: () => {} });
      
      if (!(globalThis as any)._sql_clients) (globalThis as any)._sql_clients = {};
      (globalThis as any)._sql_clients[binding.connectionString] = client;

      if (this.strings && this.templateValues) {
        return await client(this.strings as any, ...this.templateValues) as unknown as T;
      }
      return await client.unsafe(this.text, this.params) as unknown as T;
    }

    throw new Error(`[bunflare] Unsupported binding type for "${this.bindingName}". Expected D1 or Hyperdrive.`);
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  async values(): Promise<unknown[][]> {
    const results = await this.execute() as unknown as Record<string, unknown>[];
    if (!results || results.length === 0) return [];
    const firstRow = results[0];
    if (!firstRow) return [];
    const keys = Object.keys(firstRow);
    return results.map(row => keys.map(k => row[k]));
  }

  async run(): Promise<{ success: boolean; error?: string }> {
    const binding = await this.getBinding();
    if ("prepare" in binding && typeof binding.prepare === "function") {
      return await binding.prepare(this.text).bind(...this.params).run();
    }
    await this.execute();
    return { success: true };
  }
}

/**
 * Factory for creating the sql tagged template.
 */
export function createSQL(bindingName: string, driver: string = "postgres") {
  function sql(strings: string): { text: string; params: unknown[] };
  function sql(strings: TemplateStringsArray, ...values: unknown[]): SQLQuery;
  function sql(strings: TemplateStringsArray | string, ...values: unknown[]): any {
    if (typeof strings === "string") {
      return { text: strings, params: [] };
    }
    
    let text = strings[0] || "";
    let params: unknown[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val && typeof val === "object" && "text" in val && "params" in val) {
        const fragment = val as { text: string; params: unknown[] };
        text += fragment.text;
        params.push(...fragment.params);
      } else if (Array.isArray(val) && val.length > 0) {
        text += val.map(() => "?").join(", ");
        params.push(...val);
      } else {
        params.push(val);
        text += "?";
      }
      text += strings[i + 1] || "";
    }
    
    return new SQLQuery(bindingName, text, params, driver, strings as any, values);
  }

  (sql as any).unsafe = (str: string, params: unknown[] = []) => new SQLQuery(bindingName, str, params, driver);
  return sql;
}

/**
 * String generator for the actual shim file.
 */
export function getUnifiedSqlShim(defaultBinding: string, defaultDriver: string = "postgres"): string {
  // We use the code above but stringified for the shim.
  // To keep it clean, we'll only include the necessary parts for the runtime.
  return `
const getEnv = () => (globalThis).__BUNFLARE_TEST_ENV__ || (globalThis).Bun?.env;

class SQLQuery {
  constructor(bindingName, text, params, driver, strings, templateValues) {
    this.bindingName = bindingName;
    this.text = text;
    this.params = params;
    this.driver = driver || "postgres";
    this.strings = strings;
    this.templateValues = templateValues;
  }

  async getBinding() {
    const env = getEnv();
    if (!env) throw new Error(\`[bunflare] Environment not initialized.\`);
    const binding = env[this.bindingName];
    if (!binding) throw new Error(\`[bunflare] Binding "\${this.bindingName}" not found.\`);
    return binding;
  }

  async execute() {
    const binding = await this.getBinding();
    if (typeof binding.prepare === "function") {
      const res = await binding.prepare(this.text).bind(...this.params).all();
      return res.results;
    } 
    if (binding.connectionString) {
      const driver = this.driver || "postgres";
      if (driver === "pg") {
        const pgModule = ["p", "g"].join("");
        const { Client } = await import(pgModule);
        const client = new Client({ connectionString: binding.connectionString });
        await client.connect();
        try {
          let count = 0;
          const pgText = this.text.replace(/\\?/g, () => \`\\\$\${++count}\`);
          const res = await client.query(pgText, this.params);
          return res.rows;
        } finally { await client.end(); }
      }

      const pgName = ["post", "gres"].join("");
      const { default: postgres } = await import(pgName);
      const client = (globalThis)._sql_clients?.[binding.connectionString] || 
                    postgres(binding.connectionString, { max: 1, onnotice: () => {} });
      if (!(globalThis)._sql_clients) (globalThis)._sql_clients = {};
      (globalThis)._sql_clients[binding.connectionString] = client;

      if (this.strings && this.templateValues) {
        return await client(this.strings, ...this.templateValues);
      }
      return await client.unsafe(this.text, this.params);
    }
    throw new Error(\`[bunflare] Unsupported binding for "\${this.bindingName}".\`);
  }

  then(f, r) { return this.execute().then(f, r); }
  
  async values() {
    const r = await this.execute();
    if (!r || r.length === 0) return [];
    const f = r[0]; if (!f) return [];
    const k = Object.keys(f);
    return r.map(row => k.map(x => row[x]));
  }

  async run() {
    const b = await this.getBinding();
    if (typeof b.prepare === "function") return await b.prepare(this.text).bind(...this.params).run();
    return this.execute();
  }
}

function createSQL(bindingName, driver) {
  function sql(strings, ...values) {
    if (typeof strings === "string") return { text: strings, params: [] };
    let text = strings[0] || "";
    let params = [];
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val && typeof val === "object" && "text" in val && "params" in val) {
        text += val.text; params.push(...val.params);
      } else if (Array.isArray(val) && val.length > 0) {
        text += val.map(() => "?").join(", "); params.push(...val);
      } else {
        params.push(val); text += "?";
      }
      text += strings[i + 1] || "";
    }
    return new SQLQuery(bindingName, text, params, driver, strings, values);
  }
  sql.unsafe = (s, p = []) => new SQLQuery(bindingName, s, p, driver);
  return sql;
}

export const sql = createSQL("${defaultBinding}", "${defaultDriver}");
export const SQL = class {
  constructor(o) {
    return createSQL(typeof o === "string" ? o : "${defaultBinding}", "${defaultDriver}");
  }
};
`;
}
