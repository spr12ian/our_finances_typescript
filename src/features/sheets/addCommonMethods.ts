// Keep this tiny and runtime-safe
import { logStart } from "@lib/logging/FastLog";

export type Ctor<T = any> = new (...args: any[]) => T;
type CanFixSheet = { fixSheet(): void };
type CanFormatSheet = { formatSheet(): void };
type CanTrimSheet = { trimSheet(): void };

export function addCommonMethods<C extends Ctor>(Ctor: C): C {
  const proto = Ctor.prototype as any;

  if (typeof proto.fixSheet !== "function") {
    Object.defineProperty(proto, "fixSheet", {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function fixSheet(this: { sheet?: unknown; name?: string }) {
        const finish = logStart("fixSheet", this?.name ?? Ctor.name ?? "");
        try {
          const target = (this as any).sheet as Partial<CanFixSheet> | undefined;
          if (target && typeof target.fixSheet === "function") {
            return target.fixSheet(); // delegate to the real Sheet
          }
          throw new Error("sheet.fixSheet() not found on target");
        } finally {
          finish();
        }
      },
    });
  }

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

  if (typeof proto.trimSheet !== "function") {
    Object.defineProperty(proto, "trimSheet", {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function trimSheet(this: { sheet?: unknown; name?: string }) {
        const finish = logStart("trimSheet", this?.name ?? Ctor.name ?? "");
        try {
          const target = (this as any).sheet as Partial<CanTrimSheet> | undefined;
          if (target && typeof target.trimSheet === "function") {
            return target.trimSheet(); // delegate to the real Sheet
          }
          throw new Error("sheet.trimSheet() not found on target");
        } finally {
          finish();
        }
      },
    });
  }

  return Ctor;
}
