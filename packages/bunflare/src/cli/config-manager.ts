import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export interface WranglerConfig {
  name?: string;
  kv_namespaces?: { binding: string; id: string }[];
  d1_databases?: { binding: string; database_name: string; database_id: string }[];
  r2_buckets?: { binding: string; bucket_name: string }[];
  [key: string]: any;
}

/**
 * Manages Wrangler configuration files (jsonc/toml).
 */
export class ConfigManager {
  private configPath: string;
  private isJsonc: boolean;

  constructor(rootDir: string) {
    const jsoncPath = path.join(rootDir, "wrangler.jsonc");
    const tomlPath = path.join(rootDir, "wrangler.toml");

    if (existsSync(jsoncPath)) {
      this.configPath = jsoncPath;
      this.isJsonc = true;
    } else {
      this.configPath = tomlPath;
      this.isJsonc = false;
    }
  }

  exists(): boolean {
    return existsSync(this.configPath);
  }

  read(): WranglerConfig {
    if (!this.exists()) return {};
    const content = readFileSync(this.configPath, "utf-8");
    if (this.isJsonc) {
      // Simple logic to strip comments for parsing
      const stripped = content
        .replace(/(^|\s)\/\/.*$/gm, "$1") // Strip single line comments (safely)
        .replace(/\/\*[\s\S]*?\*\//g, "") // Strip multi-line comments
        .replace(/,\s*([\}\]])/g, "$1"); // Strip trailing commas
      return JSON.parse(stripped);
    } else {
      // Basic TOML parsing (stub, ideally use a real parser if needed)
      // For now, we mainly support JSONC as it's the Bunflare recommendation.
      return {}; 
    }
  }

  async write(config: WranglerConfig): Promise<void> {
    if (this.isJsonc) {
      await Bun.write(this.configPath, JSON.stringify(config, null, 2));
    } else {
      // TOML writing is more complex to preserve formatting.
      // We might want to warn the user or use a library like @iarna/toml if available.
    }
  }

  addBinding(type: "d1" | "kv" | "r2" | "do" | "workflow" | "browser" | "queue" | "queue-consumer" | "cron" | "ratelimit", data: any): void {
    const config = this.read();
    
    if (type === "d1") {
      config.d1_databases = config.d1_databases || [];
      if (!config.d1_databases.some(d => d.binding === data.binding)) config.d1_databases.push(data);
    } else if (type === "kv") {
      config.kv_namespaces = config.kv_namespaces || [];
      if (!config.kv_namespaces.some(k => k.binding === data.binding)) config.kv_namespaces.push(data);
    } else if (type === "r2") {
      config.r2_buckets = config.r2_buckets || [];
      if (!config.r2_buckets.some(r => r.binding === data.binding)) config.r2_buckets.push(data);
    } else if (type === "do") {
      config.durable_objects = config.durable_objects || { bindings: [] };
      config.durable_objects.bindings = config.durable_objects.bindings || [];
      if (!config.durable_objects.bindings.some((b: any) => b.name === data.name)) {
        config.durable_objects.bindings.push(data);
      }
    } else if (type === "workflow") {
      config.workflows = config.workflows || [];
      if (!config.workflows.some((w: any) => w.binding === data.binding)) config.workflows.push(data);
    } else if (type === "browser") {
      config.browser = data;
    } else if (type === "queue") {
      config.queues = config.queues || { producers: [] };
      config.queues.producers = config.queues.producers || [];
      if (!config.queues.producers.some((q: any) => q.binding === data.binding)) {
        config.queues.producers.push(data);
      }
    } else if (type === "queue-consumer") {
      config.queues = config.queues || { consumers: [] };
      config.queues.consumers = config.queues.consumers || [];
      if (!config.queues.consumers.some((q: any) => q.queue === data.queue)) {
        config.queues.consumers.push(data);
      }
    } else if (type === "cron") {
      config.triggers = config.triggers || { crons: [] };
      config.triggers.crons = config.triggers.crons || [];
      if (!config.triggers.crons.includes(data.schedule)) {
        config.triggers.crons.push(data.schedule);
      }
    } else if (type === "ratelimit") {
      config.ratelimits = config.ratelimits || [];
      if (!config.ratelimits.some((r: any) => r.name === data.name)) config.ratelimits.push(data);
    }

    this.write(config);
  }

  getPendingResources(): { type: string, name: string, binding: string }[] {
    const config = this.read();
    const pending: { type: string, name: string, binding: string }[] = [];

    // Check D1
    if (config.d1_databases) {
      for (const db of config.d1_databases) {
        if (db.database_id === "placeholder-id" || !db.database_id) {
          pending.push({ type: "d1", name: db.database_name, binding: db.binding });
        }
      }
    }

    // Check KV
    if (config.kv_namespaces) {
      for (const kv of config.kv_namespaces) {
        if (kv.id === "placeholder-id" || !kv.id) {
          pending.push({ type: "kv", name: kv.binding, binding: kv.binding });
        }
      }
    }

    // Check R2 (R2 doesn't have IDs in the same way, but we can check if it exists)
    // For R2, we might just check if binding exists but name is placeholder-like
    if (config.r2_buckets) {
      for (const r2 of config.r2_buckets) {
        if (r2.bucket_name.includes("placeholder")) {
           pending.push({ type: "r2", name: r2.bucket_name, binding: r2.binding });
        }
      }
    }

    return pending;
  }

  updateResourceID(type: string, binding: string, id: string): void {
    const config = this.read();
    if (type === "d1" && config.d1_databases) {
      const db = config.d1_databases.find(d => d.binding === binding);
      if (db) db.database_id = id;
    } else if (type === "kv" && config.kv_namespaces) {
      const kv = config.kv_namespaces.find(k => k.binding === binding);
      if (kv) kv.id = id;
    }
    this.write(config);
  }
}
