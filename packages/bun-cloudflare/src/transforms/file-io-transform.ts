/**
 * Transforms Bun.file() and Bun.write() to use the R2 shim and handle async.
 */
export function transformFileIO(source: string): string {
  if (!source.includes("Bun.file") && !source.includes("Bun.write")) {
    return source;
  }

  let transformed = source;

  // Replace Bun.file(path) calls
  // Transforming these is tricky because Bun.file() is synchronous but its methods are async.
  // The methods (.text(), .json(), etc) already need to be awaited in Bun, so no changes there.
  // We just need to replace Bun.file with our shim's file function.
  transformed = transformed.replace(/Bun\.file\(/g, "file(");
  
  // Replace Bun.write(path, data) calls
  // Ensure it's awaited and use the shim's write
  transformed = transformed.replace(/await\s+Bun\.write\(/g, "await write(");
  transformed = transformed.replace(/(?<!await\s)Bun\.write\(/g, "await write(");

  // Add imports if not present
  if (transformed.includes("file(") || transformed.includes("write(")) {
    if (!transformed.includes('import { file, write } from "bun-cloudflare/shims/file-io"')) {
       transformed = `import { file, write } from "bun-cloudflare/shims/file-io";\n` + transformed;
    }
  }

  return transformed;
}
