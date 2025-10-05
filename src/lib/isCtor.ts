// augmentAllSheets.ts
import type { Ctor } from "../addCommonMethods";

export function isCtor(x: any): x is Ctor {
  try {
    return typeof x === "function" && !!x.prototype;
  } catch {
    return false;
  }
}
