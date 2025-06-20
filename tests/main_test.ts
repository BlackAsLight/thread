import { assertEquals, assertRejects } from "@std/assert";
import { Thread, ThreadError } from "@doctor/thread";
import type { CreateThreadMap } from "@doctor/thread/types";

Deno.test("Worker Succeeds", async () => {
  const thread = new Thread<[number, number]>(
    new URL("./worker.ts", import.meta.url).href,
  );
  assertEquals(await thread.send(3), 3);
  thread.terminate();
});

Deno.test("Worker Fails", async () => {
  const thread = new Thread<[number, number]>(
    new URL("./worker.ts", import.meta.url).href,
  );
  await assertRejects(
    () => thread.send(0),
    RangeError,
    "Zero not allowed!",
  );
  thread.terminate();
});

Deno.test("Terminate pending Sends", async () => {
  const thread = new Thread<[number, number]>(
    new URL("./worker.ts", import.meta.url).href,
  );
  const promise = thread.send(3);
  thread.terminate();
  await assertRejects(() => promise, ThreadError, "Web Worker Terminated");
});

Deno.test("Send after Terminate", async () => {
  const thread = new Thread<[number, number]>(
    new URL("./worker.ts", import.meta.url).href,
  );
  thread.terminate();
  await assertRejects(
    () => thread.send(3),
    ThreadError,
    "Web Worker is Terminated",
  );
});

Deno.test("Not Structured Cloneable", async () => {
  type BadMap = CreateThreadMap<0, {
    [0]: [() => number, number];
  }>;
  const thread = new Thread<BadMap, 0>(
    new URL("./worker.ts", import.meta.url).href,
  );
  await assertRejects(
    () => thread.send<0>(() => 3),
    "DataCloneError",
  );
  thread.terminate();
});
