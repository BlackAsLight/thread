import type { Input, Output, ThreadMap } from "./_types.ts";
// deno-lint-ignore no-unused-vars
import type { Thread } from "./mod.ts";
// deno-lint-ignore no-unused-vars
import type { CreateThreadMap } from "./types.ts";

/**
 * `listen` is a wrapper function around the Worker API to offer a Promise like
 * experience when offloading work to workers. It is designed to work in
 * combination with the {@linkcode Thread} class.
 *
 * @typeparam M defines the map types between the main thread and worker,
 * either as a `ThreadMap<E>` or a tuple of `[Input, Output]` types.
 * @typeparam E is the numeric enum used to create `M` via
 * {@linkcode CreateThreadMap}.
 * @param handle The function which receives the messages passed via
 * `Thread.send` and returns its response.
 *
 * @example Single-Job Usage
 * ```ts ignore
 * import { listen } from "@doctor/thread/worker";
 * import type { Simple } from "./types.ts";
 *
 * listen<Simple>(function (x) {
 *   return [x.reduce((x, y) => x + y)];
 * });
 * ```
 *
 * @example Multi-Job Usage
 * ```ts ignore
 * import { listen } from "@doctor/thread/worker";
 * import type { Complex, Jobs } from "./types.ts";
 *
 * listen<Complex, Jobs>(function (x) {
 *   if (typeof x === "string") {
 *     return [`Hello ${x}`];
 *   }
 *   return [x.reduce((x, y) => x + y)];
 * });
 * ```
 */
export function listen<
  M extends ThreadMap<E> | [unknown, unknown],
  E extends number = never,
>(
  handle: (input: Input<E, M>) =>
    | [Output<E, M>, Transferable[]?]
    | Promise<[Output<E, M>, Transferable[]?]>,
): void {
  // deno-lint-ignore no-explicit-any
  (self as any).onmessage = async function (
    event: MessageEvent<[number, Input<E, M>]>,
  ): Promise<void> {
    const [id, input] = event.data;
    try {
      const [output, transfer] = await handle(input);
      // deno-lint-ignore no-explicit-any
      (self as any).postMessage([id, true, output], transfer!);
    } catch (error) {
      // deno-lint-ignore no-explicit-any
      (self as any).postMessage([id, false, error]);
    }
  };
}
