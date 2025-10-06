// Keep this tiny and runtime-safe
import { logStart } from "@lib/logging/FastLog";

export type Ctor<T = any> = new (...args: any[]) => T;
type CanFormatSheet = { formatSheet(): void };

export function addCommonMethods<C extends Ctor>(Ctor: C): C {
  const proto = Ctor.prototype as any;

  if (typeof proto.formatSheet !== "function") {
    Object.defineProperty(proto, "formatSheet", {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function formatSheet(this: { sheet?: unknown; name?: string }) {
        const finish = logStart("formatSheet", this?.name ?? Ctor.name ?? "");
        try {
          const target = (this as any).sheet as Partial<CanFormatSheet> | undefined;
          if (target && typeof target.formatSheet === "function") {
            return target.formatSheet(); // delegate to the real Sheet
          }
          throw new Error("sheet.formatSheet() not found on target");
        } finally {
          finish();
        }
      },
    });
  }

  return Ctor;
}
