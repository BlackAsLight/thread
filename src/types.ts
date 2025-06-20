import type { ThreadMap } from "./_types.ts";

/**
 * `CreateThreadMap` defines a helper type to construct a strongly typed
 * `ThreadMap` based off a numeric enum to list the possible jobs.
 *
 * @typeparam E The numeric enum representing the types of messages.
 * @typeparam M An object mapping each `E` member to an `[Input, Output]` tuple.
 *
 * @example Usage
 * ```ts
 * import type { CreateThreadMap } from "@doctor/thread/types";
 *
 * export type Simple = [number[], number];
 *
 * export const enum Jobs {
 *   Greet,
 *   Add,
 * }
 *
 * export type Complex = CreateThreadMap<Jobs, {
 *   [Jobs.Greet]: [string, string];
 *   [Jobs.Add]: [number[], number];
 * }>;
 * ```
 */
export type CreateThreadMap<E extends number, M extends ThreadMap<E>> = M;
