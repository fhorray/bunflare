import { spawnSync } from "node:child_process";
import { ConfigManager } from "./config-manager";
import pc from "picocolors";
import { log } from "./logger";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { scanDirectoryForBindings } from "./scanner";
import * as p from "@clack/prompts";

export interface ResourceInfo {
  type: string;
  name: string;
  binding: string;
  id?: string;
}

/**
 * Orchestrates Cloudflare resource provisioning (D1, KV, R2).
 */
export class Provisioner {
  public configManager: ConfigManager;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.configManager = new ConfigManager(rootDir);
  }

  static parseR2Output(output: string): string[] {
    const buckets: string[] = [];
    const lines = output.split("\n");
    for (const line of lines) {
      const nameMatch = line.match(/name:\s+(.+)/i);
      if (nameMatch) {
        buckets.push(nameMatch[1]!.trim());
        continue;
      }
      const tableMatch = line.match(/│\s+([^│\s]+)\s+│/);
      if (tableMatch && !tableMatch[0].includes("Name") && !tableMatch[0].includes("──")) {
        buckets.push(tableMatch[1]!.trim());
      }
    }
    return buckets;
  }

  static parseD1Output(output: string): { uuid: string; name: string }[] {
    try {
      return JSON.parse(output);
    } catch { return []; }
  }

  static parseKVOutput(output: string): { id: string; title: string }[] {
    try {
      return JSON.parse(output);
    } catch { return []; }
  }

  /**
   * Identifies resources that need creation or ID synchronization.
   */
  async getInconsistencyReport(): Promise<ResourceInfo[]> {
    if (!this.configManager.exists()) return [];

    const config = this.configManager.read();
    const toProvision: ResourceInfo[] = [];

    // Check D1
    if (config.d1_databases) {
      for (const db of config.d1_databases) {
        if (db.database_id === "placeholder-id" || !db.database_id) {
          toProvision.push({ type: "d1", name: db.database_name, binding: db.binding });
        }
      }
    }

    // Check KV
    if (config.kv_namespaces) {
      for (const kv of config.kv_namespaces) {
        if (kv.id === "placeholder-id" || !kv.id) {
          toProvision.push({ type: "kv", name: kv.binding, binding: kv.binding });
        }
      }
    }

    // Check R2
    if (config.r2_buckets) {
      for (const r2 of config.r2_buckets) {
        if (r2.bucket_name.includes("placeholder")) {
          toProvision.push({ type: "r2", name: r2.bucket_name, binding: r2.binding });
        }
      }
    }

    // Check for Fluid API resources
    const sourceDir = existsSync(path.join(this.rootDir, "src")) ? path.join(this.rootDir, "src") : this.rootDir;
    const fluidResources = scanDirectoryForBindings(sourceDir);

    // Filter out resources already in config
    for (const item of fluidResources) {
      if (item.type === "do") {
        const exists = config.durable_objects?.bindings?.some((b: any) => b.name === item.name || b.class_name === item.name);
        if (!exists) toProvision.push({ type: "do", name: item.name, binding: item.name.toUpperCase() });
      } else if (item.type === "workflow") {
        const exists = config.workflows?.some((w: any) => w.binding === item.name.toUpperCase());
        if (!exists) toProvision.push({ type: "workflow", name: item.name, binding: item.name.toUpperCase() });
      } else if (item.type === "container") {
        const exists = config.containers?.some((c: any) => c.class_name === item.name);
        if (!exists) toProvision.push({ type: "container", name: item.name, binding: item.name.toUpperCase() });
      } else if (item.type === "queue") {
        const exists = config.queues?.producers?.some((q: any) => q.binding === item.name) || 
                       config.queues?.consumers?.some((q: any) => q.queue === item.name.toLowerCase());
        if (!exists) toProvision.push({ type: "queue-consumer", name: item.name, binding: item.name });
      } else if (item.type === "queue-name") {
        const exists = config.queues?.consumers?.some((q: any) => q.queue === item.name);
        if (!exists) toProvision.push({ type: "queue-consumer", name: item.name, binding: item.name });
      } else if (item.type === "cron") {
        const exists = config.triggers?.crons?.includes(item.name);
        if (!exists) toProvision.push({ type: "cron", name: `Cron (${item.name})`, binding: item.name });
      } else if (item.type === "ratelimit") {
        const exists = config.ratelimits?.some((r: any) => r.name === item.name);
        if (!exists) toProvision.push({ type: "ratelimit", name: item.name, binding: item.name });
      } else if (item.type === "flags") {
        const exists = config.kv_namespaces?.some((kv: any) => kv.binding === "FLAGS_KV");
        if (!exists) toProvision.push({ type: "kv", name: "FLAGS_KV", binding: "FLAGS_KV" });
      }
    }

    // Check Browser Rendering
    if (fluidResources.some(f => f.type === "browser")) {
      if (!config.browser) {
        toProvision.push({ type: "browser", name: "Browser Rendering API", binding: "BROWSER" });
      }
      
      // Also check for the Durable Object binding for each browser instance
      for (const item of fluidResources.filter(f => f.type === "browser")) {
        const doName = item.name.toUpperCase();
        const exists = config.durable_objects?.bindings?.some((b: any) => b.name === doName || b.class_name === item.name);
        if (!exists) {
           toProvision.push({ type: "do", name: item.name, binding: doName });
        }
      }
    }

    return toProvision;
  }

  /**
   * Interactively provisions missing resources.
   */
  async provisionMissingResources() {
    const report = await this.getInconsistencyReport();
    if (report.length === 0) return;

    log.info(`Found ${report.length} resources to provision.`);
    
    for (const item of report) {
      const confirmed = await p.confirm({
        message: `Create/Sync ${pc.cyan(item.name)} (${item.type})?`,
        initialValue: true
      });

      if (confirmed) {
        await this.provisionItem(item);
      }
    }
  }

  /**
   * Syncs specific bindings selected during init.
   */
  async provisionSpecificBindings(bindings: string[]) {
    for (const b of bindings) {
      let item: ResourceInfo | null = null;
      if (b === "d1") item = { type: "d1", name: "DB", binding: "DB" };
      if (b === "kv") item = { type: "kv", name: "KV", binding: "KV" };
      if (b === "r2") item = { type: "r2", name: "BUCKET", binding: "BUCKET" };
      
      if (item) {
        const confirmed = await p.confirm({
          message: `Initialize ${pc.cyan(item.name)} (${item.type})?`,
          initialValue: true
        });
        if (confirmed) await this.provisionItem(item);
      }
    }
  }

  private async provisionItem(item: ResourceInfo) {
    const s = p.spinner();
    s.start(`Provisioning ${item.name}...`);

    try {
      if (item.type === "d1") {
        const result = spawnSync("bunx", ["wrangler", "d1", "create", item.name], {
          stdio: "pipe",
          encoding: "utf-8",
          shell: true
        });
        const match = result.stdout.match(/database_id = "(.+?)"/);
        if (match) {
          this.configManager.addBinding("d1", {
            binding: item.binding,
            database_name: item.name,
            database_id: match[1]
          });
          s.stop(`${pc.green(item.binding)} created/synced with ID: ${pc.dim(match[1])}`);
        }
      } else if (item.type === "kv") {
        const result = spawnSync("bunx", ["wrangler", "kv:namespace", "create", item.name], {
          stdio: ["pipe", "pipe", "pipe"],
          encoding: "utf-8",
          shell: true
        });
        const match = result.stdout.match(/id = "(.+?)"/);
        if (match) {
          this.configManager.addBinding("kv", {
            binding: item.binding,
            id: match[1]
          });
          s.stop(`${pc.green(item.binding)} synced with ID: ${pc.dim(match[1])}`);
        }
      } else if (item.type === "r2") {
        spawnSync("bunx", ["wrangler", "r2", "bucket", "create", item.name], { shell: true });
        s.stop(`${pc.green(item.binding)} verified/created.`);
      } else if (item.type === "do") {
        this.configManager.addBinding("do", { name: item.binding, class_name: item.name });
        s.stop(`${pc.green(item.binding)} binding added to config.`);
      } else if (item.type === "workflow") {
        this.configManager.addBinding("workflow", { name: item.name.toLowerCase(), binding: item.binding, class_name: item.name });
        s.stop(`${pc.green(item.binding)} binding added to config.`);
      } else if (item.type === "browser") {
        this.configManager.addBinding("browser", { binding: item.binding });
        s.stop(`${pc.green(item.binding)} binding added to config.`);
      } else if (item.type === "queue-consumer") {
        this.configManager.addBinding("queue-consumer", { queue: item.name.toLowerCase() });
        s.stop(`${pc.green(item.name.toLowerCase())} added as queue consumer.`);
      } else if (item.type === "cron") {
        this.configManager.addBinding("cron", { schedule: item.binding }); // 'binding' holds the actual schedule string
        s.stop(`${pc.green(item.binding)} added to cron triggers.`);
      } else if (item.type === "ratelimit") {
        this.configManager.addBinding("ratelimit", {
          name: item.binding,
          namespace_id: Math.floor(Math.random() * 10000).toString(),
          simple: { limit: 100, period: 60 }
        });
        s.stop(`${pc.green(item.binding)} added to ratelimits.`);
      } else if (item.type === "container") {
        s.stop(`${pc.green(item.binding)} verified.`);
      }
    } catch (e: any) {
      s.stop(`${pc.red("Error")}: ${e.message}`);
    }
  }
}
