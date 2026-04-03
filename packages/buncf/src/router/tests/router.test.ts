import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { createRouter } from "../index";
import fs from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "tmp-test-router");

describe("BuncfFileSystemRouter", () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(join(TEST_DIR, "src/pages"), { recursive: true });
    fs.mkdirSync(join(TEST_DIR, "src/api"), { recursive: true });

    // Create a page
    fs.writeFileSync(
      join(TEST_DIR, "src/pages/index.tsx"),
      "export default function Index() { return 'Home'; }"
    );

    // Create a layout
    fs.writeFileSync(
      join(TEST_DIR, "src/pages/_layout.tsx"),
      "export default function Layout({children}) { return children; }"
    );

    // Create an API route
    fs.writeFileSync(
      join(TEST_DIR, "src/api/hello.ts"),
      "export const GET = () => new Response('Hello');"
    );
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test("should match a page route", async () => {
    const router = createRouter({ srcDir: "tmp-test-router/src" });
    const req = new Request("http://localhost/");
    const matched = await router.match(req);

    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("page");
    expect(matched?.match.filePath).toContain("index.tsx");
  });

  test("should match an API route", async () => {
    const router = createRouter({ srcDir: "tmp-test-router/src" });
    const req = new Request("http://localhost/api/hello");
    const matched = await router.match(req);

    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("api");
    expect(matched?.match.filePath).toContain("hello.ts");
  });

  test("should resolve layouts recursively", async () => {
    const router = createRouter({ srcDir: "tmp-test-router/src" });
    const pagePath = join(TEST_DIR, "src/pages/index.tsx");
    const layouts = await router.resolveLayouts(pagePath);

    expect(layouts.length).toBe(1);
    expect(layouts[0]).toContain("_layout.tsx");
  });
});
