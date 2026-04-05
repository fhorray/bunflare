import { expect, test, describe } from "bun:test";
import { Provisioner } from "../src/cli/provisioner";

describe("Provisioner Parsers", () => {
  test("parseR2Output should handle modern key-value format", () => {
    const output = `
name: my-bucket
created_at: 2024-04-03
---
name: second-bucket
created_at: 2024-04-03
    `;
    const result = Provisioner.parseR2Output(output);
    expect(result).toEqual(["my-bucket", "second-bucket"]);
  });

  test("parseR2Output should handle legacy table format", () => {
    const output = `
┌──────────────────────────┬──────────────────────────┐
│ Name                     │ Created At               │
├──────────────────────────┼──────────────────────────┤
│ legacy-bucket            │ 2023-01-01T00:00:00Z     │
└──────────────────────────┴──────────────────────────┘
    `;
    const result = Provisioner.parseR2Output(output);
    expect(result).toEqual(["legacy-bucket"]);
  });

  test("parseD1Output should handle JSON response", () => {
    const output = JSON.stringify([
      { uuid: "123-456", name: "my-db" },
      { uuid: "789-012", name: "other-db" }
    ]);
    const result = Provisioner.parseD1Output(output);
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("my-db");
    expect(result[0]!.uuid).toBe("123-456");
  });

  test("parseKVOutput should handle JSON response", () => {
    const output = JSON.stringify([
      { id: "kv-1", title: "my-kv" }
    ]);
    const result = Provisioner.parseKVOutput(output);
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("my-kv");
    expect(result[0]!.id).toBe("kv-1");
  });
});
