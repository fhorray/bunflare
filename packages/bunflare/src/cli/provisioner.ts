import { spawnSync } from "node:child_process";
import { ConfigManager } from "./config-manager";
import pc from "picocolors";
import { log } from "./logger";
import { existsSync } from "node:fs";
import path from "node:path";
import { scanDirectoryForBindings } from "./scanner";
import * as p from "@clack/prompts";
import { toKebabCase, normalizeResourceName, toScreamingSnakeCase } from "./utils";

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
  private accountID: string | null = null;
  private email: string | null = null;

  constructor(rootDir: string, email: string | null = null) {
    this.rootDir = rootDir;
    this.email = email;
    this.configManager = new ConfigManager(rootDir);
  }

  /**
   * Automatically detects the Cloudflare Account ID to handle multi-account environments.
   */
  public async ensureAccountID() {
    const config = this.configManager.read();
    if (config.account_id) {
      this.accountID = config.account_id;
      return;
    }

    if (this.accountID || process.env.CLOUDFLARE_ACCOUNT_ID) {
      if (!this.accountID) this.accountID = process.env.CLOUDFLARE_ACCOUNT_ID || null;
      return;
    }

    const result = spawnSync("bunx", ["wrangler", "whoami"], {
      stdio: "pipe",
      encoding: "utf-8",
      shell: true,
    });

    if (result.status !== 0) return;

    const rows = Provisioner.parseWranglerTable(result.stdout);
    if (rows.length === 1) {
      this.accountID = rows[0]!["account id"] || rows[0]!.id || null;
      if (this.accountID) {
        this.configManager.setAccountID(this.accountID);
      }
    } else if (rows.length > 1) {
      const options = rows.map(r => ({
        label: r["account name"] || r.name || "Unknown Account",
        value: r["account id"] || r.id || ""
      })).filter(o => o.value !== "");

      if (options.length > 0) {
        const selected = await p.select({
          message: "Multiple accounts found. Which one should this project use?",
          options: options,
        });

        if (p.isCancel(selected)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }

        this.accountID = selected as string;
        this.configManager.setAccountID(this.accountID);
        p.log.success(`Account ID ${pc.dim(this.accountID)} saved to wrangler.jsonc`);
      }
    }
  }

  /**
   * Helper to parse Wrangler's JSON output, skipping preamble/headers.
   */
  static parseWranglerJson(output: string): any {
    if (!output || typeof output !== "string") return null;
    try {
        const jsonMatch = output.match(/(\{|\[)[\s\S]*(\}|\])/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch {
        return null;
    }
  }

  /**
   * Universal parser for Wrangler's tabular output.
   */
  static parseWranglerTable(output: string): Record<string, string>[] {
    if (!output || typeof output !== "string") return [];
    
    const lines = output.split("\n");
    const results: Record<string, string>[] = [];
    
    const headerLineIndex = lines.findIndex((line, index) => 
        line.includes("│") && !line.includes("──") && index < 15
    );

    if (headerLineIndex === -1) return [];

    const headers = lines[headerLineIndex]!
        .split("│")
        .map(h => h.trim())
        .filter(h => h !== "");

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i]!;
        if (!line.includes("│") || line.includes("──")) continue;
        
        const cells = line.split("│").map(c => c.trim()).filter(c => c !== "");
        
        if (cells.length >= headers.length) {
            const row: Record<string, string> = {};
            headers.forEach((h, index) => {
                row[h.toLowerCase()] = cells[index]!;
            });
            results.push(row);
        }
    }

    return results;
  }

  /**
   * Identifies resources that need creation or ID synchronization.
   */
  async getInconsistencyReport(onProgress?: (msg: string) => void): Promise<ResourceInfo[]> {
    if (!this.configManager.exists()) return [];

    await this.ensureAccountID();
    const config = this.configManager.read();
    const toProvision: ResourceInfo[] = [];

    // Reality Checks: Fetch what's actually on Cloudflare
    onProgress?.("Fetching KV namespaces...");
    const remoteKV = this.getRemoteKVNamespaces();
    
    onProgress?.("Fetching D1 databases...");
    const remoteD1 = this.getRemoteD1Databases();

    // 1. Check existing config for placeholders or INVALID IDs (Reality Check)
    onProgress?.("Comparing local config with Cloudflare...");
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
        const bindingName = toScreamingSnakeCase(item.name);
        const exists = config.durable_objects?.bindings?.some((b: any) => 
          normalizeResourceName(b.name) === normalizeResourceName(bindingName) || 
          normalizeResourceName(b.class_name) === normalizedName
        );
        if (!exists) toProvision.push({ type: "do", name: item.name, binding: bindingName });
      } else if (item.type === "workflow") {
        const kebabName = toKebabCase(item.name);
        const bindingName = toScreamingSnakeCase(item.name);
        const exists = config.workflows?.some((w: any) => 
          normalizeResourceName(w.binding) === normalizeResourceName(bindingName) ||
          normalizeResourceName(w.name) === normalizeResourceName(kebabName)
        );
        if (!exists) toProvision.push({ type: "workflow", name: item.name, binding: bindingName });
      } else if (item.type === "queue") {
        const kebabName = toKebabCase(item.name);
        const exists = config.queues?.producers?.some((q: any) => normalizeResourceName(q.binding) === normalizedName || normalizeResourceName(q.queue) === normalizeResourceName(kebabName)) || 
                       config.queues?.consumers?.some((q: any) => normalizeResourceName(q.queue) === normalizeResourceName(kebabName));
        if (!exists) toProvision.push({ type: "queue-consumer", name: item.name, binding: toScreamingSnakeCase(item.name) });
      } else if (item.type === "ratelimit") {
        const exists = config.ratelimits?.some((r: any) => normalizeResourceName(r.name) === normalizedName);
        if (!exists) toProvision.push({ type: "ratelimit", name: item.name, binding: toScreamingSnakeCase(item.name) });
      } else if (item.type === "flags") {
        const exists = config.kv_namespaces?.some((kv: any) => normalizeResourceName(kv.binding) === normalizeResourceName("FLAGS_KV"));
        if (!exists) toProvision.push({ type: "kv", name: "FLAGS_KV", binding: "FLAGS_KV" });
      } else if (item.type === "browser") {
        if (!config.browser || !config.browser.binding) {
          toProvision.push({ type: "browser", name: "Browser Rendering API", binding: "BROWSER" });
        }
      } else if (item.type === "d1") {
        const exists = config.d1_databases?.some((d: any) => normalizeResourceName(d.binding) === normalizedName);
        if (!exists) {
            toProvision.push({ type: "d1", name: "ecommerce-db", binding: item.name });
        }
      }
    }

    // 3. Remote Reality Check (Queues)
    onProgress?.("Fetching Cloudflare Queues...");
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

    p.log.info(`Found ${pc.yellow(report.length)} infrastructure components to sync.`);
    
    for (const item of report) {
      // Mandatory confirmation unless autoSync is true
      const shouldPrompt = !autoSync;

      let confirmed = true;
      if (shouldPrompt) {
        confirmed = await p.confirm({
          message: `Provision/Sync ${pc.cyan(item.name)} (${item.type})?`,
          initialValue: true
        }) as boolean;

        if (p.isCancel(confirmed)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
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
        // Recovery Check: Check if it already exists before creating
        const list = this.getRemoteD1Databases();
        const existing = list.find((d: any) => 
          normalizeResourceName(d.name) === normalizeResourceName(item.name) || 
          normalizeResourceName(d.name) === normalizeResourceName(item.binding)
        );
        
        if (existing) {
          await this.configManager.addBinding("d1", { binding: item.binding, database_name: existing.name, database_id: existing.uuid });
          s.stop(`${pc.green(item.binding)} linked to existing database: ${pc.dim(existing.name)}`);
          synced = true;
        } else {
          const result = spawnSync("bunx", ["wrangler", "d1", "create", item.name], { stdio: "pipe", encoding: "utf-8", shell: true });
          const match = result.stdout.match(/database_id = "(.+?)"/);
          if (match && match[1]) {
            await this.configManager.addBinding("d1", { binding: item.binding, database_name: item.name, database_id: match[1] });
            s.stop(`${pc.green(item.binding)} created ID: ${pc.dim(match[1])}`);
            synced = true;
          } else if (result.stderr.includes("already exists")) {
            // Last resort: deep scan list one more time if creation fails with 'already exists'
            const retryList = this.getRemoteD1Databases();
            const lastDitch = retryList.find((d: any) => normalizeResourceName(d.name) === normalizeResourceName(item.name));
            if (lastDitch) {
               await this.configManager.addBinding("d1", { binding: item.binding, database_name: lastDitch.name, database_id: lastDitch.uuid });
               s.stop(`${pc.green(item.binding)} recovered after conflict: ${pc.dim(lastDitch.uuid)}`);
               synced = true;
            }
          }
        }
      } else if (item.type === "kv") {
        // Recovery Check
        const namespaces = this.getRemoteKVNamespaces();
        const existing = namespaces.find(n => normalizeResourceName(n.title) === normalizeResourceName(item.name));
        
        if (existing) {
          await this.configManager.addBinding("kv", { binding: item.binding, id: existing.id });
          s.stop(`${pc.green(item.binding)} linked existing ID: ${pc.dim(existing.id)}`);
          synced = true;
        } else {
          const result = spawnSync("bunx", ["wrangler", "kv", "namespace", "create", item.name], { stdio: "pipe", encoding: "utf-8", shell: true });
          const match = result.stdout.match(/id = "(.+?)"/);
          if (match && match[1]) {
            await this.configManager.addBinding("kv", { binding: item.binding, id: match[1] });
            s.stop(`${pc.green(item.binding)} created ID: ${pc.dim(match[1])}`);
            synced = true;
          }
        }
      } else if (item.type === "r2") {
        spawnSync("bunx", ["wrangler", "r2", "bucket", "create", item.name], { shell: true });
        s.stop(`${pc.green(item.binding)} bucket verified/created.`);
        synced = true;
      } else if (item.type === "do") {
        await this.configManager.addBinding("do", { name: item.binding, class_name: item.name });
        await this.configManager.addMigration("v1", [item.name]);
        s.stop(`${pc.green(item.binding)} Durable Object binding & migration added.`);
        synced = true;
      } else if (item.type === "workflow") {
        const kebabName = toKebabCase(item.name);
        await this.configManager.addBinding("workflow", { name: kebabName, binding: item.binding, class_name: item.name });
        s.stop(`${pc.green(item.binding)} Workflow binding added.`);
        synced = true;
      } else if (item.type === "browser") {
        await this.configManager.addBinding("browser", { binding: item.binding });
        s.stop(`${pc.green(item.binding)} Browser Rendering API enabled.`);
        synced = true;
      } else if (item.type === "queue-consumer") {
        const kebabName = toKebabCase(item.name);
        
        // Recovery Check for Queues
        const remoteQueues = this.getRemoteQueues();
        if (remoteQueues.some(rq => normalizeResourceName(rq) === normalizeResourceName(kebabName))) {
          await this.configManager.addBinding("queue-consumer", { queue: kebabName });
          s.stop(`${pc.green(kebabName)} linked existing queue.`);
          synced = true;
        } else {
          s.message(`Creating remote queue: ${pc.cyan(kebabName)}...`);
          const result = spawnSync("bunx", ["wrangler", "queues", "create", kebabName], { stdio: "pipe", encoding: "utf-8", shell: true });
          
          if (result.status === 0) {
            await this.configManager.addBinding("queue-consumer", { queue: kebabName });
            s.stop(`${pc.green(kebabName)} Consumer & Remote Queue created.`);
            synced = true;
          } else {
            // Even if creation fails, maybe it was created anyway or we missed it in the list (race condition)
            // But we'll trust the error for now and let the user know.
            s.stop(`${pc.red("Error")}: Could not create remote queue ${pc.cyan(kebabName)}.`);
            if (result.stderr) console.log(`${pc.dim("│")}     ${pc.red(result.stderr.trim())}`);
            return;
          }
        }
      } else if (item.type === "queue-remote") {
        const remoteQueues = this.getRemoteQueues();
        if (remoteQueues.some(rq => normalizeResourceName(rq) === normalizeResourceName(item.name))) {
           s.stop(`${pc.green(item.name)} Remote Queue already exists.`);
        } else {
           spawnSync("bunx", ["wrangler", "queues", "create", item.name], { shell: true });
           s.stop(`${pc.green(item.name)} Remote Queue provisioned.`);
        }
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
