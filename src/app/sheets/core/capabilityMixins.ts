// src/sheets/core/capabilityMixins.ts
import type { Ctor } from "./mixins";
import { queueJob } from "../../../queueJob";

// Capabilities are *mixins* that expect BaseSheet protected API on `this`

export interface CanFormatSheet { formatSheet(): void }
export const Formattable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    formatSheet() {
      const t0 = (this as any).start("formatSheet");
      try { (this as any).sheet.formatSheet(); }
      finally { (this as any).finish("formatSheet", t0); }
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanFormatSheet>;
};

export interface CanTrimSheet { trimSheet(): void }
export const Trimmable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    trimSheet() {
      (this as any).sheet.trimSheet();
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanTrimSheet>;
};

export interface CanFixSheet { fixSheet(): void }
export const Fixable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    // expects `update()` on `this`
    fixSheet() {
      const t0 = (this as any).start("fixSheet");
      try {
        (this as any).update();
        (this as any).sheet.fixSheet();
      } finally {
        (this as any).finish("fixSheet", t0);
      }
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanFixSheet>;
};

export interface QueueOps {
  queueFormatSheet(): void;
  queueTrimSheet(): void;
}
export const Queueable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    queueFormatSheet() {
      const t0 = (this as any).start("queueFormatSheet");
      try { queueJob("FORMAT_SHEET", { sheetName: (this as any).sheet.name }); }
      finally { (this as any).finish("queueFormatSheet", t0); }
    }
    queueTrimSheet() {
      const t0 = (this as any).start("queueTrimSheet");
      try { queueJob("TRIM_SHEET", { sheetName: (this as any).sheet.name }); }
      finally { (this as any).finish("queueTrimSheet", t0); }
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & QueueOps>;
};
