import { describe, expect, it } from "bun:test";
import { transformS3 } from "../transforms/s3-transform";

describe("S3 Transform", () => {
    it("should inject imports and replace Bun.s3 and Bun.S3Client", () => {
        const source = `
            const client = new Bun.S3Client({ bucket: "test" });
            const f = Bun.s3.file("hello.txt");
        `;
        const transformed = transformS3(source);
        
        expect(transformed).toContain('import { s3, S3Client } from "bun-cloudflare/shims/s3"');
        expect(transformed).toContain('const client = new S3Client({ bucket: "test" })');
        expect(transformed).toContain('const f = s3.file("hello.txt")');
        expect(transformed).not.toContain("Bun.s3");
        expect(transformed).not.toContain("Bun.S3Client");
    });

    it("should not inject import if Bun.s3 is not present", () => {
        const source = `console.log("hello")`;
        const transformed = transformS3(source);
        expect(transformed).toBe(source);
    });

    it("should not inject import twice", () => {
        const source = `
            import { s3, S3Client } from "bun-cloudflare/shims/s3";
            const f = Bun.s3.file("hello.txt");
        `;
        const transformed = transformS3(source);
        // Counting occurrences of the import (ignoring exact spacing)
        const count = (transformed.match(/from "bun-cloudflare\/shims\/s3"/g) || []).length;
        expect(count).toBe(1);
    });
});
