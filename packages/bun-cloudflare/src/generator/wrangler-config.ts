import { existsSync, readFileSync } from "node:fs";

/**
 * Loads and parses a wrangler configuration from file.
 * Supports .toml, .json, and .jsonc formats.
 * This is the source of truth for bindings and infrastructure.
 */
export async function loadWranglerConfig(path?: string): Promise<Record<string, unknown> | null> {
    const defaultPaths = ["wrangler.toml", "wrangler.json", "wrangler.jsonc"];
    const searchPath = path || defaultPaths.find(p => existsSync(p));
    
    if (!searchPath || !existsSync(searchPath)) return null;
    
    const content = readFileSync(searchPath, "utf8");
    
    if (searchPath.endsWith(".toml")) {
        // @ts-ignore - Bun.TOML is available in Bun environment
        return Bun.TOML.parse(content);
    }
    
    if (searchPath.endsWith(".json") || searchPath.endsWith(".jsonc")) {
        // Strip comments for JSONC support
        const cleanJson = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
        return JSON.parse(cleanJson);
    }
    
    return null;
}
