import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { normalizeResourceName } from "./utils";

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
    const jsoncPath = path.resolve(rootDir, "wrangler.jsonc");
    const tomlPath = path.resolve(rootDir, "wrangler.toml");

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
      return {}; 
    }
  }

  write(config: WranglerConfig): void {
    if (this.isJsonc) {
      const output = JSON.stringify(config, null, 2);
      // Synchronous write to avoid race conditions during CLI execution
      writeFileSync(this.configPath, output);
    }
  }

  /**
   * Adds or updates a binding in the configuration (UPSERT).
   */
  addBinding(type: "d1" | "kv" | "r2" | "do" | "workflow" | "browser" | "queue" | "queue-consumer" | "cron" | "ratelimit", data: any): void {
    const config = this.read();
    const normalizedDataName = data.name ? normalizeResourceName(data.name) : null;
    const normalizedDataBinding = data.binding ? normalizeResourceName(data.binding) : 
                                  data.queue ? normalizeResourceName(data.queue) : null;
    
    if (type === "d1") {
      config.d1_databases = config.d1_databases || [];
      const idx = config.d1_databases.findIndex(d => normalizeResourceName(d.binding) === normalizedDataBinding);
      if (idx === -1) config.d1_databases.push(data);
      else config.d1_databases[idx] = { ...config.d1_databases[idx], ...data };
    } else if (type === "kv") {
      config.kv_namespaces = config.kv_namespaces || [];
      const idx = config.kv_namespaces.findIndex(k => normalizeResourceName(k.binding) === normalizedDataBinding);
      if (idx === -1) config.kv_namespaces.push(data);
      else config.kv_namespaces[idx] = { ...config.kv_namespaces[idx], ...data };
    } else if (type === "r2") {
      config.r2_buckets = config.r2_buckets || [];
      const idx = config.r2_buckets.findIndex(r => normalizeResourceName(r.binding) === normalizedDataBinding);
      if (idx === -1) config.r2_buckets.push(data);
      else config.r2_buckets[idx] = { ...config.r2_buckets[idx], ...data };
    } else if (type === "do") {
      config.durable_objects = config.durable_objects || { bindings: [] };
      config.durable_objects.bindings = config.durable_objects.bindings || [];
      const idx = config.durable_objects.bindings.findIndex((b: any) => 
        normalizeResourceName(b.name) === normalizedDataName || normalizeResourceName(b.class_name) === normalizedDataName
      );
      if (idx === -1) config.durable_objects.bindings.push(data);
      else config.durable_objects.bindings[idx] = { ...config.durable_objects.bindings[idx], ...data };
    } else if (type === "workflow") {
      config.workflows = config.workflows || [];
      const idx = config.workflows.findIndex((w: any) => 
        normalizeResourceName(w.binding) === normalizedDataBinding || normalizeResourceName(w.name) === normalizedDataName
      );
      if (idx === -1) config.workflows.push(data);
      else config.workflows[idx] = { ...config.workflows[idx], ...data };
    } else if (type === "browser") {
      config.browser = { ...config.browser, ...data };
    } else if (type === "queue") {
      config.queues = config.queues || { producers: [] };
      config.queues.producers = config.queues.producers || [];
      const idx = config.queues.producers.findIndex((q: any) => normalizeResourceName(q.binding) === normalizedDataBinding);
      if (idx === -1) config.queues.producers.push(data);
      else config.queues.producers[idx] = { ...config.queues.producers[idx], ...data };
    } else if (type === "queue-consumer") {
      config.queues = config.queues || { consumers: [] };
      config.queues.consumers = config.queues.consumers || [];
      const normalizedDataQueue = normalizeResourceName(data.queue);
      const idx = config.queues.consumers.findIndex((q: any) => normalizeResourceName(q.queue) === normalizedDataQueue);
      if (idx === -1) config.queues.consumers.push(data);
      else config.queues.consumers[idx] = { ...config.queues.consumers[idx], ...data };
    } else if (type === "cron") {
      config.triggers = config.triggers || { crons: [] };
      config.triggers.crons = config.triggers.crons || [];
      if (!config.triggers.crons.includes(data.schedule)) {
        config.triggers.crons.push(data.schedule);
      }
    } else if (type === "ratelimit") {
      config.ratelimits = config.ratelimits || [];
      const idx = config.ratelimits.findIndex((r: any) => normalizeResourceName(r.name) === normalizedDataName);
      if (idx === -1) config.ratelimits.push(data);
      else config.ratelimits[idx] = { ...config.ratelimits[idx], ...data };
    }

    this.write(config);
  }

  getPendingResources(): { type: string, name: string, binding: string }[] {
    const config = this.read();
    const pending: { type: string, name: string, binding: string }[] = [];

    if (config.d1_databases) {
      for (const db of config.d1_databases) {
        if (db.database_id === "placeholder-id" || !db.database_id) {
          pending.push({ type: "d1", name: db.database_name, binding: db.binding });
        }
      }
    }
    if (config.kv_namespaces) {
      for (const kv of config.kv_namespaces) {
        if (kv.id === "placeholder-id" || !kv.id) {
          pending.push({ type: "kv", name: kv.binding, binding: kv.binding });
        }
      }
    }
    if (config.r2_buckets) {
      for (const r2 of config.r2_buckets) {
        if (r2.bucket_name.includes("placeholder")) {
           pending.push({ type: "r2", name: r2.bucket_name, binding: r2.binding });
        }
      }
    }
    return pending;
  }
}
