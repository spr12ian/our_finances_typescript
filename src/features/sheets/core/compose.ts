// src/sheets/core/compose.ts
type AnyObj = Record<string, unknown>;
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export function composeSheet<H extends object, Cs extends AnyObj[]>(
  host: H,
  ...caps: Cs
): H & UnionToIntersection<Cs[number]> {
  return Object.assign(host, ...caps) as any;
}
