/**
 * Precise path transformation for NPM distribution.
 * Maps ./src/*.ts to ./dist/types/*.d.ts.
 * Prevents recursive extension appending.
 */
export function transformValue(val: any, key?: string, isTypeContext = false): any {
  // Propagate type context if current key is "types" or "typings"
  const currentIsType = isTypeContext || key === "types" || key === "typings";

  if (typeof val === "string") {
    // ONLY transform if it starts with ./src/ AND ends with .ts BUT NOT .d.ts
    if (val.startsWith("./src/") && val.endsWith(".ts") && !val.endsWith(".d.ts")) {
      if (currentIsType) {
        // Map to Types (now directly in dist/)
        return val.replace("./src/", "./dist/").replace(/\.ts$/, ".d.ts");
      } else {
        // Map to Compiled JavaScript (now directly in dist/)
        return val.replace("./src/", "./dist/").replace(/\.ts$/, ".js");
      }
    }
    return val;
  }
  if (typeof val === "object" && val !== null) {
    const next: any = Array.isArray(val) ? [] : {};
    for (const k in val) {
      // Pass the key and current context down for nested objects/arrays
      next[k] = transformValue(val[k], k, currentIsType);
    }
    return next;
  }
  return val;
}