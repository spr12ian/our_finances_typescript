// columns.ts
import type { OneBased } from "../types/oneBased";

/** Map of column keys to 1-based indices (A=1). */
export type ColumnMap = Record<string, OneBased<number>>;

/** 1-based column index for Range APIs. */
export function col1<T extends ColumnMap, K extends keyof T>(cols: T, key: K): number {
  return cols[key]; // OneBased<number> is a subtype of number
}

/** 0-based column index for array indexing (e.g., getValues()). */
export function col0<T extends ColumnMap, K extends keyof T>(cols: T, key: K): number {
  return cols[key] - 1;
}

/** Get many 1-based indices in one go (preserves tuple length & order). */
export function cols1<
  T extends ColumnMap,
  const K extends readonly (keyof T)[]
>(cols: T, keys: K): { [I in keyof K]: number } {
  return keys.map(k => cols[k]) as { [I in keyof K]: number };
}

/** Get many 0-based indices in one go (preserves tuple length & order). */
export function cols0<
  T extends ColumnMap,
  const K extends readonly (keyof T)[]
>(cols: T, keys: K): { [I in keyof K]: number } {
  return keys.map(k => cols[k] - 1) as { [I in keyof K]: number };
}
