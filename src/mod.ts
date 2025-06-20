import type { Input, Output, ThreadMap } from "./_types.ts";
// deno-lint-ignore no-unused-vars
import type { listen } from "./worker.ts";
// deno-lint-ignore no-unused-vars
import type { CreateThreadMap } from "./types.ts";

/**
 * `Thread` is a wrapper class around the Worker API to offer a Promise like
 * experience when offloading work to workers. It is designed to work in
 * combination with the {@linkcode listen} function.
 *
 * @typeparam M defines the map types between the main thread and worker,
 * either as a `ThreadMap<E>` or a tuple of `[Input, Output]` types.
 * @typeparam E is the numeric enum used to create `M` via
 * {@linkcode CreateThreadMap}.
 *
 * @example Simple Job Usage
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 * import { Thread } from "@doctor/thread";
 * import type { Simple } from "./types.ts";
 *
 * const thread = new Thread<Simple>(
 *   new URL("./worker.ts", import.meta.url).href,
 * );
 *
 * assertEquals(await thread.send([1, 2, 3]), 6);
 *
 * thread.terminate();
 * ```
 *
 * @example Complex Job Usage
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 * import { Thread } from "@doctor/thread";
 * import type { Complex, Jobs } from "./types.ts";
 *
 * const thread = new Thread<Complex, Jobs>(
 *   new URL("./worker.ts", import.meta.url).href,
 * );
 *
 * assertEquals(await thread.send<Jobs.Greet>("Adam"), "Hello Adam");
 *
 * assertEquals(await thread.send<Jobs.Add>([0, 1, 2, 3, 4, 5]), 15);
 *
 * thread.terminate();
 * ```
 */
export class Thread<
  M extends ThreadMap<E> | [unknown, unknown],
  E extends number = never,
> {
  #nextID = 0;
  #pending = new Map<
    number,
    [
      (value: Output<E, M> | PromiseLike<Output<E, M>>) => void,
      (reason?: unknown) => void,
    ]
  >();
  #terminated = false;
  #worker: Worker;
  /**
   * Constructs a new instance of a worker.
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
   * @typeparam T is a numberic member from the enum, representing the specific
   * message being sent.
   *
   * @param input The input to send to the Worker.
   * @param transfer Optional array of Transferable objects from the input to
   * transfer ownership of.
   * @returns A Promise that resolves with the output of the Worker.
   */
  send<T extends E>(
    input: Input<T, M>,
    transfer?: Transferable[],
  ): Promise<Output<T, M>> {
    return new Promise((resolve, reject) => {
      if (this.#terminated) reject(new ThreadError("Web Worker is Terminated"));
      const id = ++this.#nextID;
      try {
        this.#worker.postMessage([id, input], transfer!);
        // deno-lint-ignore no-explicit-any
        this.#pending.set(id, [resolve as any, reject]);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Immediately terminates the Worker. This does not offer the Worker an
   * opportunity to finish its operations; it is stopped at once. All pending
   * promises are rejected with a {@linkcode ThreadError}.
   */
  terminate(): void {
    this.#terminated = true;
    this.#worker.terminate();
    for (const [_id, [_resolve, reject]] of this.#pending.entries()) {
      reject(new ThreadError("Web Worker Terminated"));
    }
    this.#pending.clear();
  }

  #handle(
    event: MessageEvent<[number, boolean, Output<E, M>]>,
  ): void {
    const [id, success, value] = event.data;
    this.#pending.get(id)?.[success ? 0 : 1](value);
    this.#pending.delete(id);
  }
}

/**
 * `ThreadError`, extends {@linkcode Error}, is a custom error class for
 * {@linkcode Thread} errors.
 */
export class ThreadError extends Error {
  /**
   * Constructs a new instance.
   * @param message The error message.
   * @param options Error options.
   */
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}
