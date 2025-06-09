/**
 * `Thread` is a wrapper class around the Worker API to offer a Promise like
 * experience when offloading work to workers. It is designed to work in
 * combination with the {@linkcode listen} function.
 *
 * @typeparam I The type of data to send.
 * @typeparam O The type of data to expect to receive.
 *
 * @example Usage
 * ```ts ignore
 * import { assertEquals } from "jsr:@std/assert";
 * import { Thread } from "jsr:@doctor/thread";
 *
 * const thread = new Thread<number[], number>(
 *   new URL("./worker.ts", import.meta.url).href
 * );
 *
 * assertEquals(await thread.send([1, 2, 3]), 6);
 * thread.terminate();
 * ```
 */
export class Thread<I, O> {
  #nextID = 0;
  #pending = new Map<
    number,
    [(value: O) => void, (reason?: unknown) => void]
  >();
  #worker: Worker;
  /**
   * Constructs a new instance.
   *
   * @param specifier The URL or path to the Worker.
   * @param options Optional WorkerOptions to be passed to the Worker.
   */
  constructor(specifier: string | URL, options?: Omit<WorkerOptions, "type">) {
    this.#worker = new Worker(specifier, { ...options, type: "module" });
    this.#worker.onmessage = this.#handle.bind(this);
  }

  /**
   * Sends input to the Worker to process.
   * May throw if the input isn't sendable (see
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm | Structured Clone Algorithm}),
   * the worker throws, or the worker is terminated before finishing.
   *
   * @param input The input to send to the Worker.
   * @param transfer Optional array of Transferable objects from the input to
   * transfer ownership of.
   * @returns A Promise that resolves with the output of the Worker.
   */
  send(input: I, transfer?: Transferable[]): Promise<O> {
    return new Promise<O>((resolve, reject) => {
      const id = ++this.#nextID;
      try {
        this.#worker.postMessage([id, input], transfer!);
        this.#pending.set(id, [resolve, reject]);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Immediately terminates the Worker. This does not offer the Worker an
   * opportunity to finish its operations; it is stopped at once. All pending
   * promises are rejected.
   */
  terminate(): void {
    this.#worker.terminate();
    for (const [_id, [_resolve, reject]] of this.#pending.entries()) {
      reject(new Error("Web Worker Terminated"));
    }
    this.#pending.clear();
  }

  #handle(event: MessageEvent<[number, boolean, O]>): void {
    const [id, success, value] = event.data;
    this.#pending.get(id)?.[success ? 0 : 1](value);
    this.#pending.delete(id);
  }
}
