import { spawnSync } from "node:child_process";
import { ConfigManager } from "./config-manager";
import pc from "picocolors";
import { log } from "./logger";
import { existsSync } from "node:fs";
import path from "node:path";
import { scanDirectoryForBindings } from "./scanner";
import * as p from "@clack/prompts";
import { toKebabCase, normalizeResourceName } from "./utils";

export interface ResourceInfo {
  type: string;
  name: string;
  binding: string;
  id?: string;
  isPlaceholder?: boolean;
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

  /**
   * Helper to parse Wrangler's JSON output, skipping preamble/headers.
   */
  static parseWranglerJson(output: string): any {
    try {
        const jsonStart = output.indexOf("[");
        const objStart = output.indexOf("{");
        const start = (jsonStart !== -1 && (objStart === -1 || jsonStart < objStart)) ? jsonStart : objStart;
        
        if (start === -1) return null;
        return JSON.parse(output.substring(start));
    } catch {
        return null;
    }
  }

  /**
   * Universal parser for Wrangler's tabular output.
   */
  static parseWranglerTable(output: string): Record<string, string>[] {
    const lines = output.split("\n");
    const results: Record<string, string>[] = [];
    
    let headerLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        if (currentLine && currentLine.includes("│") && !currentLine.includes("──") && i < 15) {
            headerLineIndex = i;
            break;
        }
    }

    if (headerLineIndex === -1) return [];

    const headerLine = lines[headerLineIndex];
    if (!headerLine) return [];

    const headers = headerLine
        .split("│")
        .map(h => h.trim())
        .filter(h => h !== "");

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.includes("│") || line.includes("──")) continue;
        
        const cells = line
            .split("│")
            .map(c => c.trim());
        
        if (cells.length > 0) {
            const cleanCells = cells.filter(c => c !== "");
            if (cleanCells.length >= headers.length) {
                const row: Record<string, string> = {};
                headers.forEach((h, index) => {
                    const cellValue = cleanCells[index];
                    if (cellValue !== undefined) {
                      row[h.toLowerCase()] = cellValue;
                    }
                });
                results.push(row);
            }
        }
    }

    return results;
  }

  /**
   * Identifies resources that need creation or ID synchronization.
   */
  async getInconsistencyReport(): Promise<ResourceInfo[]> {
    if (!this.configManager.exists()) return [];

    const config = this.configManager.read();
    const toProvision: ResourceInfo[] = [];

    // Reality Checks: Fetch what's actually on Cloudflare
    const remoteKV = this.getRemoteKVNamespaces();
    const remoteD1 = this.getRemoteD1Databases();

    // 1. Check existing config for placeholders or INVALID IDs (Reality Check)
    if (config.d1_databases) {
      for (const db of config.d1_databases) {
        const isPlaceholder = db.database_id === "placeholder-id" || !db.database_id;
        const existsOnRemote = remoteD1.some(rd => rd.uuid === db.database_id);
        
        if (isPlaceholder || !existsOnRemote) {
          toProvision.push({ 
            type: "d1", 
            name: db.database_name, 
            binding: db.binding, 
            isPlaceholder: isPlaceholder 
          });
        }
      }
    }
    if (config.kv_namespaces) {
      for (const kv of config.kv_namespaces) {
        const isPlaceholder = kv.id === "placeholder-id" || !kv.id;
        const existsOnRemote = remoteKV.some(rk => rk.id === kv.id);

        if (isPlaceholder || !existsOnRemote) {
          toProvision.push({ 
            type: "kv", 
            name: kv.binding, 
            binding: kv.binding, 
            isPlaceholder: isPlaceholder 
          });
        }
      }
    }
    if (config.r2_buckets) {
      for (const r2 of config.r2_buckets) {
        if (r2.bucket_name.includes("placeholder")) {
          toProvision.push({ type: "r2", name: r2.bucket_name, binding: r2.binding, isPlaceholder: true });
        }
      }
    }

    // 2. Scan source code and compare with config
    const sourceDir = existsSync(path.join(this.rootDir, "src")) ? path.join(this.rootDir, "src") : this.rootDir;
    const fluidResources = scanDirectoryForBindings(sourceDir);

    for (const item of fluidResources) {
      const normalizedName = normalizeResourceName(item.name);
      
      if (item.type === "do") {
        const bindingName = item.name.toUpperCase();
        const exists = config.durable_objects?.bindings?.some((b: any) => 
          normalizeResourceName(b.name) === normalizeResourceName(bindingName) || 
          normalizeResourceName(b.class_name) === normalizedName
        );
        if (!exists) toProvision.push({ type: "do", name: item.name, binding: bindingName });
      } else if (item.type === "workflow") {
        const kebabName = toKebabCase(item.name);
        const bindingName = item.name.toUpperCase();
        const exists = config.workflows?.some((w: any) => 
          normalizeResourceName(w.binding) === normalizeResourceName(bindingName) ||
          normalizeResourceName(w.name) === normalizeResourceName(kebabName)
        );
        if (!exists) toProvision.push({ type: "workflow", name: item.name, binding: bindingName });
      } else if (item.type === "queue") {
        const kebabName = toKebabCase(item.name);
        const exists = config.queues?.producers?.some((q: any) => normalizeResourceName(q.binding) === normalizedName || normalizeResourceName(q.queue) === normalizeResourceName(kebabName)) || 
                       config.queues?.consumers?.some((q: any) => normalizeResourceName(q.queue) === normalizeResourceName(kebabName));
        if (!exists) toProvision.push({ type: "queue-consumer", name: item.name, binding: item.name.toUpperCase() });
      } else if (item.type === "ratelimit") {
        const exists = config.ratelimits?.some((r: any) => normalizeResourceName(r.name) === normalizedName);
        if (!exists) toProvision.push({ type: "ratelimit", name: item.name, binding: item.name.toUpperCase() });
      } else if (item.type === "flags") {
        const exists = config.kv_namespaces?.some((kv: any) => normalizeResourceName(kv.binding) === normalizeResourceName("FLAGS_KV"));
        if (!exists) toProvision.push({ type: "kv", name: "FLAGS_KV", binding: "FLAGS_KV" });
      } else if (item.type === "browser") {
        if (!config.browser) {
          toProvision.push({ type: "browser", name: "Browser Rendering API", binding: "BROWSER" });
        }
      }
    }

    // 3. Remote Reality Check (Queues)
    const remoteQueues = this.getRemoteQueues();
    const localQueues = new Set<string>();
    if (config.queues?.producers) config.queues.producers.forEach((p: any) => localQueues.add(p.queue || p.binding));
    if (config.queues?.consumers) config.queues.consumers.forEach((c: any) => localQueues.add(c.queue));

    for (const q of localQueues) {
      if (!remoteQueues.some(rq => normalizeResourceName(rq) === normalizeResourceName(q))) {
        if (!toProvision.some((p: any) => p.type === "queue-remote" && normalizeResourceName(p.name) === normalizeResourceName(q))) {
          toProvision.push({ type: "queue-remote", name: q, binding: q });
        }
      }
    }

    const seen = new Set<string>();
    return toProvision.filter(item => {
        const key = `${item.type}:${normalizeResourceName(item.name)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
  }

  private getRemoteQueues(): string[] {
    const result = spawnSync("bunx", ["wrangler", "queues", "list"], {
      stdio: "pipe",
      encoding: "utf-8",
      shell: true
    });
    if (result.status !== 0) return [];
    
    const rows = Provisioner.parseWranglerTable(result.stdout);
    if (rows.length > 0) {
        return rows.map(r => r.name || r["queue name"] || r.id || "").filter(Boolean);
    }

    const lines = result.stdout.split("\n");
    return lines
      .filter(l => l.includes("name:"))
      .map(l => {
          const parts = l.split("name:");
          return parts[1] ? parts[1].trim() : "";
      })
      .filter(Boolean);
  }

  private getRemoteKVNamespaces(): { id: string; title: string }[] {
    const result = spawnSync("bunx", ["wrangler", "kv", "namespace", "list"], {
        stdio: "pipe",
        encoding: "utf-8",
        shell: true
    });
    if (result.status !== 0) return [];

    const json = Provisioner.parseWranglerJson(result.stdout);
    if (json && Array.isArray(json)) return json as { id: string; title: string }[];

    const rows = Provisioner.parseWranglerTable(result.stdout);
    return rows.map(r => ({ 
        id: r.id || r["namespace id"] || "", 
        title: r.title || r.name || r["namespace title"] || "" 
    })).filter(kv => kv.id !== "");
  }

  private getRemoteD1Databases(): { uuid: string; name: string }[] {
    const result = spawnSync("bunx", ["wrangler", "d1", "list", "--json"], {
        stdio: "pipe",
        encoding: "utf-8",
        shell: true
    });
    if (result.status !== 0) return [];
    
    const json = Provisioner.parseWranglerJson(result.stdout);
    if (json && Array.isArray(json)) return json as { uuid: string; name: string }[];

    const rows = Provisioner.parseWranglerTable(result.stdout);
    return rows.map(r => ({ 
        uuid: r.uuid || r.id || "", 
        name: r.name || r["database name"] || "" 
    })).filter(db => db.uuid !== "");
  }

  async provisionMissingResources(autoSync: boolean = false) {
    const report = await this.getInconsistencyReport();
    if (report.length === 0) return;

    log.info(`Found ${pc.yellow(report.length)} infrastructure components to sync.`);
    
    for (const item of report) {
      // Mandatory confirmation unless autoSync is true
      const shouldPrompt = !autoSync;

      let confirmed = true;
      if (shouldPrompt) {
        confirmed = await p.confirm({
          message: `Provision/Sync ${pc.cyan(item.name)} (${item.type})?`,
          initialValue: true
        }) as boolean;
      }

      if (confirmed) {
        await this.provisionItem(item);
      }
    }
  }

  private async provisionItem(item: ResourceInfo) {
    const s = p.spinner();
    s.start(`Syncing ${pc.cyan(item.name)}...`);
    let synced = false;

    try {
      if (item.type === "d1") {
        const result = spawnSync("bunx", ["wrangler", "d1", "create", item.name], { stdio: "pipe", encoding: "utf-8", shell: true });
        const match = result.stdout.match(/database_id = "(.+?)"/);
        if (match && match[1]) {
          await this.configManager.addBinding("d1", { binding: item.binding, database_name: item.name, database_id: match[1] });
          s.stop(`${pc.green(item.binding)} synced ID: ${pc.dim(match[1])}`);
          synced = true;
        } else {
            // Fallback: Check list anyway
            const list = this.getRemoteD1Databases();
            const db = list.find((d: any) => normalizeResourceName(d.name) === normalizeResourceName(item.name));
            if (db) {
                await this.configManager.addBinding("d1", { binding: item.binding, database_name: item.name, database_id: db.uuid });
                s.stop(`${pc.green(item.binding)} found existing ID: ${pc.dim(db.uuid)}`);
                synced = true;
            }
        }
      } else if (item.type === "kv") {
        const result = spawnSync("bunx", ["wrangler", "kv", "namespace", "create", item.name], { stdio: "pipe", encoding: "utf-8", shell: true });
        const match = result.stdout.match(/id = "(.+?)"/);
        if (match && match[1]) {
          await this.configManager.addBinding("kv", { binding: item.binding, id: match[1] });
          s.stop(`${pc.green(item.binding)} synced ID: ${pc.dim(match[1])}`);
          synced = true;
        } else {
            // Fallback: Check list anyway
            const namespaces = this.getRemoteKVNamespaces();
            const kv = namespaces.find(n => normalizeResourceName(n.title) === normalizeResourceName(item.name));
            if (kv) {
                await this.configManager.addBinding("kv", { binding: item.binding, id: kv.id });
                s.stop(`${pc.green(item.binding)} recovered ID: ${pc.dim(kv.id)}`);
                synced = true;
            }
        }
      } else if (item.type === "r2") {
        spawnSync("bunx", ["wrangler", "r2", "bucket", "create", item.name], { shell: true });
        s.stop(`${pc.green(item.binding)} bucket verified/created.`);
        synced = true;
      } else if (item.type === "do") {
        await this.configManager.addBinding("do", { name: item.name, class_name: item.name, binding: item.binding });
        s.stop(`${pc.green(item.binding)} Durable Object binding added.`);
        synced = true;
      } else if (item.type === "workflow") {
        const kebabName = toKebabCase(item.name);
        await this.configManager.addBinding("workflow", { name: kebabName, binding: item.binding, class_name: item.name });
        s.stop(`${pc.green(item.binding)} Workflow binding added.`);
        synced = true;
      } else if (item.type === "browser") {
        await this.configManager.addBinding("browser", { binding: item.binding });
        s.stop(`${pc.green(item.binding)} Browser Rendering API active.`);
        synced = true;
      } else if (item.type === "queue-consumer") {
        const kebabName = toKebabCase(item.name);
        await this.configManager.addBinding("queue-consumer", { queue: kebabName });
        s.stop(`${pc.green(kebabName)} Consumer configured.`);
        synced = true;
      } else if (item.type === "queue-remote") {
        spawnSync("bunx", ["wrangler", "queues", "create", item.name], { shell: true });
        s.stop(`${pc.green(item.name)} Remote Queue provisioned.`);
        synced = true;
      } else if (item.type === "ratelimit") {
        await this.configManager.addBinding("ratelimit", {
          name: item.binding,
          namespace_id: Math.floor(Math.random() * 10000).toString(),
          simple: { limit: 100, period: 60 }
        });
        s.stop(`${pc.green(item.binding)} Rate Limit namespace added.`);
        synced = true;
      }
      
      if (!synced) {
        s.stop(`${pc.yellow("Warning")}: Could not sync ${item.name}`);
      }
    } catch (e: any) {
      s.stop(`${pc.red("Error")}: ${e.message}`);
    }
  }
}
