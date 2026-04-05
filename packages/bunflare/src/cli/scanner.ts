import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export interface DetectedBinding {
  type: "d1" | "kv" | "r2" | "ai" | "do" | "workflow" | "container" | "browser" | "queue" | "cron" | "queue-name" | "ratelimit" | "flags";
  name: string;
  metadata?: any;
}

/**
 * Scans a directory recursively for Cloudflare binding usage.
 * Uses regex-based detection for common Bunflare patterns.
 */
export function scanDirectoryForBindings(dirPath: string): DetectedBinding[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const bindings: DetectedBinding[] = [];
  const patterns = [
    { type: "do", regex: /export\s+const\s+(\w+)\s*=\s*durable\(/g },
    { type: "workflow", regex: /export\s+const\s+(\w+)\s*=\s*workflow\(/g },
    { type: "container", regex: /export\s+const\s+(\w+)\s*=\s*container\(/g },
    { type: "browser", regex: /export\s+const\s+(\w+)\s*=\s*browser\(/g },
    { type: "queue", regex: /tasks\.enqueue\s*\(\s*["'](\w+)["']/g }, // Producer
    { type: "queue", regex: /export\s+const\s+(\w+)\s*=\s*queue\(/g }, // Consumer
    { type: "cron", regex: /cron\s*\(\s*{\s*schedule\s*:\s*["'](.+?)["']/g },
    { type: "queue-name", regex: /queue\s*\(\s*{\s*queue\s*:\s*["'](.+?)["']/g },
    { type: "ratelimit", regex: /rateLimit\s*\(\s*{\s*binding\s*:\s*["'](\w+)["']/g },
    { type: "flags", regex: /flags\.evaluate\(/g },
  ];

  const scanFile = (filePath: string) => {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".js") && !filePath.endsWith(".tsx") && !filePath.endsWith(".jsx")) {
      return;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      for (const { type, regex } of patterns) {
        let match;
        // Reset regex state for global searches
        regex.lastIndex = 0;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            bindings.push({ type: type as any, name: match[1] });
          }
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  };

  const traverse = (currentDir: string) => {
    const files = readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (statSync(fullPath).isDirectory()) {
        // Skip node_modules and .git
        if (file === "node_modules" || file === ".git" || file === "dist") continue;
        traverse(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  };

  if (statSync(dirPath).isDirectory()) {
    traverse(dirPath);
  } else {
    scanFile(dirPath);
  }

  // Deduplicate results
  return Array.from(new Set(bindings.map(b => JSON.stringify(b)))).map(s => JSON.parse(s));
}

/**
 * @deprecated Use scanDirectoryForBindings for comprehensive detection.
 */
export function scanForBindings(entrypoint: string): DetectedBinding[] {
  return scanDirectoryForBindings(entrypoint);
}
