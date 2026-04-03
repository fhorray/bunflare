/**
 * Transforms Bun.file() and Bun.write() to use the R2 shim and handle async.
 */
export function transformFileIO(source: string): string {
  if (!source.includes("Bun.file") && !source.includes("Bun.write")) {
    return source;
  }

  let transformed = source;

  // Replace Bun.file(path) calls with __bunFile to avoid TDZ collision
  // when user writes: const file = Bun.file(...)
  transformed = transformed.replace(/Bun\.file\(/g, "__bunFile(");
  
  // Replace Bun.write(path, data) calls
  transformed = transformed.replace(/await\s+Bun\.write\(/g, "await __bunWrite(");
  transformed = transformed.replace(/(?<!await\s)Bun\.write\(/g, "await __bunWrite(");

  // Add imports if not present
  if (transformed.includes("__bunFile(") || transformed.includes("__bunWrite(")) {
    if (!transformed.includes('import { file as __bunFile, write as __bunWrite } from "bun-cloudflare/shims/file-io"')) {
       transformed = `import { file as __bunFile, write as __bunWrite } from "bun-cloudflare/shims/file-io";\n` + transformed;
    }
  }

  return transformed;
}
