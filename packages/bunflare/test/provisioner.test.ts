import { expect, test, describe } from "bun:test";
import { Provisioner } from "../src/cli/provisioner";

describe("Provisioner Parsers", () => {
  test("parseWranglerTable should handle legacy table format", () => {
    const output = `
┌──────────────────────────┬──────────────────────────┐
│ Name                     │ Created At               │
├──────────────────────────┼──────────────────────────┤
│ legacy-bucket            │ 2023-01-01T00:00:00Z     │
└──────────────────────────┴──────────────────────────┘
    `;
    const result = Provisioner.parseWranglerTable(output);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("legacy-bucket");
  });

  test("parseWranglerJson should handle JSON response", () => {
    const output = JSON.stringify([
      { uuid: "123-456", name: "my-db" },
      { uuid: "789-012", name: "other-db" }
    ]);
    const result = Provisioner.parseWranglerJson(output);
    expect(result.length).toBe(2);
    expect(result[0].uuid).toBe("123-456");
  });
});
