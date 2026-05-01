import { expect, test, describe, spyOn } from "bun:test";
import { getKvShim } from "../plugin/shims/kv/index.ts";
import { getR2Shim } from "../plugin/shims/r2.ts";
import { getCryptoShim } from "../plugin/shims/crypto.ts";

const transpiler = new Bun.Transpiler({ loader: "ts" });

function evalShim(shimCode: string, globalMock: any) {
  // Strip imports and types
  let code = shimCode.replace(/import .* from .*;/g, "");
  
  const transpiled = transpiler.transformSync(code).replace(/export /g, "");
  
  return new Function("globalThis", `
    const exports = {};
    ${transpiled}
    // Collect all exported functions/classes into exports object
    if (typeof KV !== 'undefined') exports.KV = KV;
    if (typeof file !== 'undefined') exports.file = file;
    if (typeof write !== 'undefined') exports.write = write;
    if (typeof password !== 'undefined') exports.password = password;
    if (typeof CryptoHasher !== 'undefined') exports.CryptoHasher = CryptoHasher;
    return exports;
  `)(globalMock);
}

describe("Shim Logic Tests", () => {
  
  describe("KV Shim", () => {
    test("should interact with mocked KV binding", async () => {
      const mockKV = {
        get: async (key: string) => key === "foo" ? "bar" : null,
        put: async (key: string, val: string) => {},
        delete: async (key: string) => {},
      };
      const getSpy = spyOn(mockKV, "get");
      const putSpy = spyOn(mockKV, "put");

      const globalMock = { env: { "MY_KV": mockKV } };
      const KVModule = evalShim(getKvShim("MY_KV"), globalMock);

      const kv = new KVModule.KV();
      
      expect(await kv.get("foo")).toBe("bar");
      expect(getSpy).toHaveBeenCalledWith("foo");

      await kv.set("hello", "world");
      expect(putSpy).toHaveBeenCalledWith("hello", "world");
    });

    test("should throw if binding is missing", () => {
      const globalMock = { env: {} };
      const KVModule = evalShim(getKvShim("MISSING_KV"), globalMock);

      expect(() => new KVModule.KV()).toThrow(/not found/);
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
