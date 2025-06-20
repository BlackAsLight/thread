export type ThreadMap<E extends number> = Record<
  E,
  [unknown, unknown]
>;

export type Input<
  E extends number,
  M extends ThreadMap<number> | [unknown, unknown],
> = M extends ThreadMap<number> ? M[E][0] : M[0];

export type Output<
  E extends number,
  M extends ThreadMap<number> | [unknown, unknown],
> = M extends ThreadMap<number> ? M[E][1] : M[1];
