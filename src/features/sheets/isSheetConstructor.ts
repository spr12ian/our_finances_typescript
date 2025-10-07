// augmentAllSheets.ts
import type { SheetConstructor } from "./addCommonMethods";

export function isSheetConstructor(x: any): x is SheetConstructor {
  try {
    return typeof x === "function" && !!x.prototype;
  } catch {
    return false;
  }
}
