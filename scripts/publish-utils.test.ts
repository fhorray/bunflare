import { describe, expect, it } from "bun:test";
import { transformValue } from "./publish-utils";

describe("transformValue", () => {
  it("should transform standard src paths to dist by default", () => {
    expect(transformValue("./src/index.ts")).toBe("./dist/index.js");
    expect(transformValue("./src/plugin.ts")).toBe("./dist/plugin.js");
  });

  it("should transform 'types' context to .d.ts", () => {
    expect(transformValue("./src/index.ts", "types")).toBe("./dist/index.d.ts");
    expect(transformValue(["./src/index.ts"], "types")).toEqual(["./dist/index.d.ts"]);
  });

  it("should transform code fields to .js, 'types' fields to .d.ts, and 'bin' fields correctly", () => {
    expect(transformValue("./src/index.ts", "types")).toBe("./dist/index.d.ts");
    expect(transformValue("./src/index.ts", "main")).toBe("./dist/index.js");
    expect(transformValue("./src/plugin.ts", "import")).toBe("./dist/plugin.js");
    
    // Test bin mapping (object recursive)
    expect(transformValue({ "bunflare": "./src/cli/index.ts" })).toEqual({ "bunflare": "./dist/cli/index.js" });
  });

  it("should handle nested src paths in both contexts", () => {
    expect(transformValue("./src/runtime/context.ts", "types")).toBe("./dist/runtime/context.d.ts");
    expect(transformValue("./src/runtime/context.ts", "import")).toBe("./dist/runtime/context.js");
  });

  it("should recursively transform objects", () => {
    const input = {
      ".": {
        import: "./src/index.ts",
        types: "./src/types.ts",
      },
      "./plugin": {
        import: "./src/plugin.ts",
        types: "./src/types.ts"
      }
    };

    const expected = {
      ".": {
        import: "./dist/index.js",
        types: "./dist/types.d.ts",
      },
      "./plugin": {
        import: "./dist/plugin.js",
        types: "./dist/types.d.ts"
      }
    };

    expect(transformValue(input)).toEqual(expected);
  });

  it("should recursively transform arrays with context inheritance", () => {
    const input = ["./src/index.ts", "./src/plugin.ts"];
    
    // Code context (Default)
    expect(transformValue(input)).toEqual(["./dist/index.js", "./dist/plugin.js"]);
    
    // Type context
    expect(transformValue(input, "types")).toEqual(["./dist/index.d.ts", "./dist/plugin.d.ts"]);
  });
});
