import { describe, expect, it, beforeEach } from "bun:test";
import { Database } from "../shims/sqlite";
import { file, write } from "../shims/file-io";
import { s3 } from "../shims/s3";
import { password, hash } from "../shims/crypto";
import { gzipSync, gunzipSync } from "../shims/compression";
import { redis } from "../shims/redis";
import { Cookie } from "../shims/cookies";
import { setBunCloudflareContext } from "../runtime/context";
import type { KVNamespace, R2Bucket, D1Database, IncomingRequestCfProperties, ExecutionContext } from "@cloudflare/workers-types";

describe("Shims Exhaustive Tests", () => {
    const mockCf = {} as IncomingRequestCfProperties;
    const mockCtx = {
        waitUntil: (promise: Promise<any>) => {},
        passThroughOnException: () => {}
    } as ExecutionContext;

    describe("SQLite (D1) Shim", () => {
        const mockD1 = {
            prepare: (sql: string) => ({
                bind: (...params: unknown[]) => ({
                    all: async () => ({ results: [{ id: 1, name: "Test" }] }),
                    first: async () => ({ id: 1, name: "Test" }),
                    run: async () => ({ success: true }),
                    raw: async () => [[1, "Test"]]
                })
            }),
            exec: async (sql: string) => ({ success: true })
        } as unknown as D1Database;

        beforeEach(() => {
            setBunCloudflareContext({
                env: { DB: mockD1 },
                cf: mockCf,
                ctx: mockCtx
            });
        });

        it("should execute query.all() correctly", async () => {
            const db = new Database("DB");
            const stmt = db.query("SELECT * FROM users");
            const results = await stmt.all();
            expect(results).toEqual([{ id: 1, name: "Test" }]);
        });

        it("should execute query.get() correctly", async () => {
            const db = new Database("DB");
            const result = await db.query("SELECT * FROM users").get();
            expect(result).toEqual({ id: 1, name: "Test" });
        });

        it("should execute exec() correctly", async () => {
           const db = new Database("DB");
           await db.exec("CREATE TABLE foo (id INT)");
        });
    });

    describe("File-IO (Legacy/Unsupported) Shim", () => {
        it("should throw informative error on file() call", () => {
            expect(() => file("test.txt")).toThrow(/not supported/);
        });

        it("should throw informative error on write() call", async () => {
            await expect(write("test.txt", "content")).rejects.toThrow(/not supported/);
        });
    });

    describe("S3 (R2) Shim", () => {
        const mockR2 = {
            get: async (_path: string) => ({
                text: async () => '{"key": "value"}',
                json: async () => ({ key: "value" }),
                arrayBuffer: async () => new ArrayBuffer(8),
                blob: async () => new Blob(['{"key": "value"}']),
                head: async () => ({ size: 12 })
            }),
            put: async (_path: string, _data: any) => ({}),
            head: async (_path: string) => ({ size: 12 }),
            delete: async (_path: string) => ({})
        } as unknown as R2Bucket;

        beforeEach(() => {
            setBunCloudflareContext({
                env: { MY_BUCKET: mockR2 },
                cf: mockCf,
                ctx: mockCtx
            });
        });

        it("should read s3.file().text() correctly", async () => {
            const f = s3.file("test.txt");
            const text = await f.text();
            expect(text).toBe('{"key": "value"}');
        });

        it("should read s3.file().json() correctly", async () => {
            const f = s3.file("test.json");
            const json = await f.json();
            expect(json).toEqual({ key: "value" });
        });

        it("should read s3.file().size() correctly", async () => {
            const f = s3.file("test.txt");
            const size = await f.size();
            expect(size).toBe(12);
        });

        it("should write via s3.write() correctly", async () => {
            await s3.write("test.txt", "new content");
        });

        it("should write via s3.file().write() correctly", async () => {
            await s3.file("test.txt").write("new content");
        });

        it("should delete via s3.file().delete() correctly", async () => {
            await s3.file("test.txt").delete();
        });
    });

    describe("Crypto Shim", () => {
        it("should hash a password correctly", async () => {
            const h = await password.hash("password123");
            expect(h).toBeDefined();
            expect(h.length).toBeGreaterThan(0);
        });

        it("should verify a password correctly", async () => {
            const h = await password.hash("password123");
            const isValid = await password.verify("password123", h);
            expect(isValid).toBe(true);
        });

        it("should hash data correctly", async () => {
            const h = await hash("some data");
            expect(h).toBeDefined();
        });
    });

    describe("Compression Shim", () => {
        it("should gzip and gunzip data correctly", async () => {
            const data = new TextEncoder().encode("Hello Cloudflare!");
            const compressed = await gzipSync(data);
            const decompressed = await gunzipSync(compressed);
            expect(new TextDecoder().decode(decompressed)).toBe("Hello Cloudflare!");
        });
    });

    describe("Redis (KV) Shim", () => {
        const mockKV = {
            get: async (key: string) => "value",
            put: async (key: string, value: string, options?: any) => {},
            delete: async (key: string) => {}
        } as unknown as KVNamespace;

        beforeEach(() => {
            setBunCloudflareContext({
                env: { REDIS: mockKV },
                cf: mockCf,
                ctx: mockCtx
            });
        });

        it("should get and set redis values", async () => {
            const v = await redis.get("mykey");
            expect(v).toBe("value");
            await redis.set("mykey", "newvalue");
        });
    });

    describe("Cookies Shim", () => {
        it("should parse cookies correctly", () => {
            const cookies = Cookie.parse("foo=bar; baz=qux");
            expect(cookies.foo).toBe("bar");
            expect(cookies.baz).toBe("qux");
        });

        it("should serialize cookies correctly", () => {
            const s = Cookie.serialize("foo", "bar", { maxAge: 3600 });
            expect(s).toBe("foo=bar; Max-Age=3600");
        });
    });
});
