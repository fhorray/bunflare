import { describe, expect, it, beforeEach } from "bun:test";
import { Database } from "../shims/sqlite";
import { file, write } from "../shims/file-io";
import { s3, S3Client } from "../shims/s3";
import { password, hash } from "../shims/crypto";
import { gzipSync, gunzipSync } from "../shims/compression";
import { redis } from "../shims/redis";
import { Cookie } from "../shims/cookies";
import { setBunCloudflareContext } from "../runtime/context";
import type { KVNamespace, R2Bucket, D1Database, IncomingRequestCfProperties, ExecutionContext } from "@cloudflare/workers-types";

describe("Shims Exhaustive Tests", () => {
    const mockCf = {} as IncomingRequestCfProperties;
    const mockCtx = {
        waitUntil: (promise: Promise<any>) => { },
        passThroughOnException: () => { }
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

    describe("File-IO (R2) Shim", () => {
        const mockR2 = {
            get: async (_path: string) => ({
                text: async () => "file content",
            }),
            put: async (_path: string, _data: any) => ({}),
            head: async (_path: string) => ({ size: 12 })
        } as unknown as R2Bucket;

        beforeEach(() => {
            setBunCloudflareContext({
                env: { BUCKET: mockR2 },
                cf: mockCf,
                ctx: mockCtx
            });
        });

        it("should read file().text() correctly via R2", async () => {
            const f = file("test.txt");
            const text = await f.text();
            expect(text).toBe("file content");
        });

        it("should write via write() correctly to R2", async () => {
            await write("test.txt", "new content");
        });

        it("should support s3:// protocol via file()", async () => {
            const f = file("s3://MY_BUCKET/test.txt");
            const text = await f.text();
            expect(text).toBe("file content");
        });
    });

    describe("S3 (R2) Shim", () => {
        const mockR2 = {
            get: async (path: string) => ({
                text: async () => path === "test.json" ? '{"key": "value"}' : 'file content',
                json: async () => ({ key: "value" }),
                arrayBuffer: async () => new ArrayBuffer(8),
                blob: async () => new Blob(['content']),
                httpMetadata: { contentType: "application/json" },
                size: 12,
                uploaded: new Date("2025-01-07T00:00:00Z"),
                etag: "etag-123"
            }),
            put: async (path: string, data: any) => ({ size: typeof data === 'string' ? data.length : 0 }),
            head: async (path: string) => path === "nonexistent.txt" ? null : ({ 
                size: 12, 
                etag: "etag-123", 
                uploaded: new Date("2025-01-07T00:00:00Z"),
                httpMetadata: { contentType: "text/plain" }
            }),
            delete: async (path: string) => ({}),
            list: async (options: any) => ({
                truncated: false,
                objects: [{ key: "test.txt", size: 12, etag: "etag-123", uploaded: new Date() }],
                cursor: "next-cursor"
            })
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
            expect(text).toBe('file content');
        });

        it("should read s3.file().json() correctly", async () => {
            const f = s3.file("test.json");
            const json = await f.json();
            expect(json).toEqual({ key: "value" });
        });

        it("should check existence via s3.file().exists()", async () => {
            const f = s3.file("test.txt");
            expect(await f.exists()).toBe(true);
            const f2 = s3.file("nonexistent.txt");
            expect(await f2.exists()).toBe(false);
        });

        it("should get stats via s3.file().stat()", async () => {
            const f = s3.file("test.txt");
            const stat = await f.stat();
            expect(stat.size).toBe(12);
            expect(stat.etag).toBe("etag-123");
            expect(stat.type).toBe("text/plain");
        });

        it("should list objects via s3.list()", async () => {
            const result = await s3.list();
            expect(result.contents.length).toBe(1);
            expect(result.contents[0].key).toBe("test.txt");
        });

        it("should write via S3Client.write() static method", async () => {
            const size = await S3Client.write("test.txt", "content");
            expect(size).toBe(7);
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
            put: async (key: string, value: string, options?: any) => { },
            delete: async (key: string) => { }
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
