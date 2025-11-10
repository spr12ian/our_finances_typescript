// getA1Ranges.ts

// Derive valid prefixes from CELLS keys like "DATE_BLOCK_1", "MONEY_BLOCK_2", etc.
type CellPrefixes<TCells extends Record<string, string>> =
  keyof TCells extends infer K
    ? K extends string
      ? K extends `${infer P}_${string}`
        ? P
        : never
      : never
    : never;

export function getA1Ranges<
  T extends { CELLS: Record<string, string> },
  P extends CellPrefixes<T["CELLS"]>
>(meta: T, rangeType: P): string[] {
  const cells = meta.CELLS;

  return Object.entries(cells)
    .filter(([key]) => key.startsWith(`${rangeType}_`))
    .map(([, range]) => range);
}

// (optional) export the helper type if you ever want to inspect prefixes:
//
// export type MetaCellPrefixes<T> = T extends { CELLS: infer C }
//   ? C extends Record<string, string>
//     ? CellPrefixes<C>
//     : never
//   : never;
