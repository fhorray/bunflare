/**
 * Pure logic for the Bun.sql / Bun.SQL shim.
 * This is used both at runtime in the Worker and during unit tests.
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean; error?: string }>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
}

export class SQLFragment {
  constructor(public text: string, public params: unknown[]) {}
}

export class SQLQuery<T = unknown[]> {
  constructor(private bindingName: string, private text: string, private params: unknown[]) {}

  private get db(): D1Database {
    const env = (globalThis as any).__BUNFLARE_TEST_ENV__ || (globalThis as any).Bun?.env;
    if (!env) {
      throw new Error(`[bunflare] Environment not initialized. Cannot access D1 binding "${this.bindingName}".`);
    }
    const realBinding = env[this.bindingName] as D1Database;
    
    if (!realBinding) {
      throw new Error(`[bunflare] D1 binding "${this.bindingName}" not found in Bun.env`);
    }
    return realBinding;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  async execute(): Promise<T> {
    const res = await this.db.prepare(this.text).bind(...this.params).all();
    return res.results as unknown as T;
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
    return this.db.prepare(this.text).bind(...this.params).run();
  }
}

export function createSQL(bindingName: string) {
  function sql(strings: string): SQLFragment;
  function sql(strings: TemplateStringsArray, ...values: unknown[]): SQLQuery;
  function sql(strings: TemplateStringsArray | string, ...values: unknown[]): SQLFragment | SQLQuery {
    if (typeof strings === "string") {
      return new SQLFragment(strings, []);
    }
    
    let text = strings[0] || "";
    let params: unknown[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val instanceof SQLFragment) {
        text += val.text;
        params.push(...val.params);
      } else if (Array.isArray(val) && val.length > 0) {
        text += val.map(() => "?").join(", ");
        params.push(...val);
      } else {
        params.push(val);
        text += "?";
      }
      text += strings[i + 1] || "";
    }
    
    return new SQLQuery(bindingName, text, params);
  }

  (sql as any).unsafe = (str: string) => new SQLFragment(str, []);
  
  return sql;
}
