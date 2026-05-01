import { expect, test, describe, spyOn } from "bun:test";
import { getRedisShim } from "../plugin/src/shims/redis/index.ts";
import { getR2Shim } from "../plugin/src/shims/r2.ts";
import { getCryptoShim } from "../plugin/src/shims/crypto.ts";
import { getD1DatabaseShim } from "../plugin/src/shims/d1/database.ts";

const transpiler = new Bun.Transpiler({ loader: "ts" });

function evalShim(shimCode: string, globalMock: any) {
  // Strip imports and types
  let code = shimCode.replace(/import .* from .*;/g, "");
  
  const transpiled = transpiler.transformSync(code).replace(/export /g, "");
  
  return new Function("globalThis", `
    const exports = {};
    ${transpiled}
    // Collect all exported functions/classes into exports object
    if (typeof redis !== 'undefined') exports.redis = redis;
    if (typeof RedisClient !== 'undefined') exports.RedisClient = RedisClient;
    if (typeof file !== 'undefined') exports.file = file;
    if (typeof write !== 'undefined') exports.write = write;
    if (typeof password !== 'undefined') exports.password = password;
    if (typeof CryptoHasher !== 'undefined') exports.CryptoHasher = CryptoHasher;
    if (typeof Database !== 'undefined') exports.Database = Database;
    return exports;
  `)(globalMock);
}

describe("Shim Logic Tests", () => {
  
  describe("D1 Database Shim", () => {
    test("should map Database calls to D1 binding", async () => {
      const mockD1 = {
        prepare: (sql: string) => ({
          bind: (...params: any[]) => ({
            all: async () => ({ results: [{ id: 1, val: "test" }], success: true }),
            run: async () => ({ success: true })
          })
        })
      };

      const globalMock = { 
        Bun: { env: { "MY_DB": mockD1 } }
      };

      const D1Module = evalShim(getD1DatabaseShim("MY_DB"), globalMock);
      const db = new D1Module.Database();

      const results = await db.query("SELECT * FROM tests").all();
      expect(results).toEqual({
        results: [{ id: 1, val: "test" }],
        success: true
      });

      await db.run("INSERT INTO tests (val) VALUES (?)", "hello");
    });
  });


  describe("R2 Shim", () => {
    test("Bun.file() shim logic", async () => {
      const mockBucket = {
        get: async (path: string) => {
          if (path === "exists.txt") return {
            text: async () => "file content",
            json: async () => ({ a: 1 }),
            arrayBuffer: async () => new ArrayBuffer(8)
          };
          return null;
        },
        head: async (path: string) => path === "exists.txt" ? {} : null,
        put: async (path: string, data: any) => {}
      };

      const globalMock = { env: { "STORAGE": mockBucket } };
      const R2Module = evalShim(getR2Shim("STORAGE"), globalMock);

      const file = R2Module.file("exists.txt");
      expect(await file.text()).toBe("file content");
      expect(await file.exists()).toBe(true);

      const missingFile = R2Module.file("missing.txt");
      expect(await missingFile.exists()).toBe(false);

      await R2Module.write("new.txt", "data");
    });
  });

  describe("Crypto Shim", () => {
    test("Bun.password.hash/verify logic", async () => {
      const globalMock = { crypto: globalThis.crypto };
      const CryptoModule = evalShim(getCryptoShim(), globalMock);

      const hash = await CryptoModule.password.hash("password");
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");

      const isValid = await CryptoModule.password.verify("password", hash);
      expect(isValid).toBe(true);

      const isInvalid = await CryptoModule.password.verify("wrong", hash);
      expect(isInvalid).toBe(false);
    });
  });
});
