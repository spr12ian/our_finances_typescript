// oneBased.ts

export type OneBased<N extends number = number> = N extends
  | 0
  | -1
  | -2
  | -3
  | -4
  | -5
  ? never
  : N & { __brand: "OneBased" };

// Accept a plain literal, *brand on return* (compile-time only)
export const oneBased = <N extends number>(
  n: N extends 0 | -1 | -2 | -3 | -4 | -5 ? never : N
) => n as OneBased<N>;
