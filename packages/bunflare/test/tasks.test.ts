import { expect, test, describe, mock, beforeEach } from "bun:test";
import { tasks } from "../src/tasks";
import { setCloudflareContext } from "../src/runtime/context";

describe("Background Tasks", () => {
  let mockWaitUntil: any;

  beforeEach(() => {
    mockWaitUntil = mock(() => {});
    setCloudflareContext({
      env: {},
      cf: {},
      ctx: {
        waitUntil: mockWaitUntil,
        passThroughOnException: () => {}
      } as any
    });
  });

  test("tasks.background(promise) should call ctx.waitUntil", () => {
    const p = Promise.resolve("ok");
    tasks.background(p);
    expect(mockWaitUntil).toHaveBeenCalledWith(p);
  });

  test("tasks.background(fn) should call ctx.waitUntil with returned promise", async () => {
    let called = false;
    const fn = async () => {
      called = true;
      return "ok";
    };
    tasks.background(fn);
    expect(called).toBe(true);
    expect(mockWaitUntil).toHaveBeenCalled();
  });

  test("tasks.enqueue should call queue.send", async () => {
    const mockSend = mock(async () => "sent");
    const mockQueue = {
      send: mockSend
    };
    setCloudflareContext({
      env: { MY_QUEUE: mockQueue },
      cf: {},
      ctx: { waitUntil: mockWaitUntil } as any
    });

    const body = { hello: "world" };
    await tasks.enqueue("MY_QUEUE", body, { delaySeconds: 10 });
    
    expect(mockSend).toHaveBeenCalledWith(body, { delaySeconds: 10 });
  });

  test("tasks.enqueue should throw if queue not found", async () => {
    setCloudflareContext({
      env: {},
      cf: {},
      ctx: { waitUntil: mockWaitUntil } as any
    });

    expect(tasks.enqueue("NON_EXISTENT", {})).rejects.toThrow(/not found/);
  });
});
