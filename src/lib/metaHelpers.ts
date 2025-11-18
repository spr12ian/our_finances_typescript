// metaHelpers.ts
import type { SheetKey } from "src/constants/sheetNames"; // or wherever SheetKey lives

export function defineSheetMeta<
  Name extends SheetKey,
  T extends { SHEET: { NAME: Name } }
>(meta: T): Readonly<T> {
  return meta;
}
