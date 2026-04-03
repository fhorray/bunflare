/**
 * Transforms secondary Bun APIs like crypto, compression, and redis.
 */
export function transformSecondary(source: string): string {
  let transformed = source;

  // 1. Crypto transformations (Bun.password -> password)
  if (transformed.includes("Bun.password")) {
    transformed = transformed.replace(/(?:await\s+)?Bun\.password\.(hash|verify)\(/g, (match, op) => {
      return match.startsWith("await") ? `await password.${op}(` : `await password.${op}(`;
    });
    if (!transformed.includes('import { password } from "bun-cloudflare/shims/crypto"')) {
      transformed = `import { password } from "bun-cloudflare/shims/crypto";\n` + transformed;
    }
  }

  // 2. Compression transformations (Bun.gzipSync -> gzipSync)
  if (transformed.includes("Bun.gzipSync") || transformed.includes("Bun.gunzipSync")) {
    transformed = transformed.replace(/(?:await\s+)?Bun\.(g?un?zipSync)\(/g, (match, op) => {
      const shimOp = op.startsWith("g") ? "gzipSync" : "gunzipSync";
      return match.startsWith("await") ? `await ${shimOp}(` : `await ${shimOp}(`;
    });
    if (!transformed.includes('import { gzipSync, gunzipSync } from "bun-cloudflare/shims/compression"')) {
      transformed = `import { gzipSync, gunzipSync } from "bun-cloudflare/shims/compression";\n` + transformed;
    }
  }

  // 3. Redis transformation (Bun.redis -> redis)
  if (transformed.includes("Bun.redis")) {
    transformed = transformed.replace(/Bun\.redis/g, "redis");
    if (!transformed.includes('import { redis } from "bun-cloudflare/shims/redis"')) {
      transformed = `import { redis } from "bun-cloudflare/shims/redis";\n` + transformed;
    }
  }

  return transformed;
}
