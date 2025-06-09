/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

/**
 * A utility type to optionally return a promise.
 * @typeparam T The type that may be wrapped in a Promise.
 */
export type OptionalPromise<T> = T | Promise<T>;

/**
 * `listen` is a wrapper function around the Worker API to offer a Promise like experience when offloading work to workers. It is designed to work in combination with the {@linkcode Thread} class.
 *
 * @typeparam I The type of data to expect to receive.
 * @typeparam O The type of data to return.
 * @param handle The function to handle the work.
 *
 * @example Usage
 * ```ts ignore
 * import { listen } from "jsr:@doctor/thread/worker";
 *
 * listen<number[], number>(function(input) {
 *   return [input.reduce((x, y) => x + y)];
 * });
 * ```
 */
export function listen<I, O>(
  handle: (input: I) => OptionalPromise<[O, Transferable[]?]>,
): void {
  self.onmessage = async function (event: MessageEvent<[number, I]>) {
    const [id, input] = event.data;
    try {
      const [output, transfer] = await handle(input);
      self.postMessage([id, true, output], transfer!);
    } catch (error) {
      self.postMessage([id, false, error]);
    }
  };
}
