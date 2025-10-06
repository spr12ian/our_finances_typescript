// augmentAllSheets.ts
import type { Ctor } from "../features/sheets/addCommonMethods";

export function isCtor(x: any): x is Ctor {
  try {
    return typeof x === "function" && !!x.prototype;
  } catch {
    return false;
  }
}
