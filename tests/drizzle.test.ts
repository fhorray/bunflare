import { expect, test, describe, mock } from "bun:test";
import { drizzle } from "../plugin/src/drizzle";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

describe("Drizzle Bunflare Adapter", () => {
  const users = sqliteTable("users", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
  });

  test("should execute single select query", async () => {
    // Mock SQL Client
    const mockValues = mock(async () => [[1, "Alice"], [2, "Bob"]]);
    const mockClient: any = { // Partial mock
      unsafe: mock((sql: string, params: unknown[]) => ({
        values: mockValues,
        run: mock(async () => {})
      }))
    };

    const db = drizzle({ client: mockClient, schema: { users } });
    const result = await db.select().from(users);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(mockClient.unsafe).toHaveBeenCalled();
  });

  test("should handle insert (.run())", async () => {
    const mockRun = mock(async () => {});
    const mockClient: any = {
      unsafe: mock((sql: string, params: unknown[]) => ({
        values: mock(async () => []),
        run: mockRun
      }))
    };

    const db = drizzle({ client: mockClient });
    await db.insert(users).values({ id: 3, name: "Charlie" });

    expect(mockRun).toHaveBeenCalled();
    expect(mockClient.unsafe).toHaveBeenCalledWith(
      expect.stringContaining("insert into"),
      expect.arrayContaining([3, "Charlie"])
    );
  });

  test("should support batch operations (Relational Queries)", async () => {
    const mockValues = mock(async () => [[1, "Alice"]]);
    const mockClient: any = {
      unsafe: mock((sql: string, params: unknown[]) => ({
        values: mockValues,
        run: mock(async () => {})
      }))
    };

    const db = drizzle({ client: mockClient, schema: { users } });
    const result = await db.query.users.findMany();

    expect(result).toHaveLength(1);
    expect(mockClient.unsafe).toHaveBeenCalled();
  });

  test("should support multi-client instances", async () => {
    const client1: any = { unsafe: mock(() => ({ values: async () => [[1]] })) };
    const client2: any = { unsafe: mock(() => ({ values: async () => [[2]] })) };

    const db1 = drizzle({ client: client1 });
    const db2 = drizzle({ client: client2 });

    const res1 = await db1.select().from(users);
    const res2 = await db2.select().from(users);

    expect(res1[0].id).toBe(1);
    expect(res2[0].id).toBe(2);
    expect(client1.unsafe).toHaveBeenCalled();
    expect(client2.unsafe).toHaveBeenCalled();
  });
});
