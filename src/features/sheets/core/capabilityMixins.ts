// src/sheets/core/capabilityMixins.ts

import type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";

// Capabilities are *mixins* that expect BaseSheet protected API on `this`
export type Ctor<T = {}> = abstract new (...args: any[]) => T;
export const Formattable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    formatSheet() {
      const t0 = (this as any).start("formatSheet");
      try {
        (this as any).sheet.formatSheet();
      } finally {
        (this as any).finish("formatSheet", t0);
      }
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanFormatSheet>;
};

export const Trimmable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    trimSheet() {
      (this as any).sheet.trimSheet();
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanTrimSheet>;
};

export const Fixable = <TBase extends Ctor>(Base: TBase) => {
  abstract class Mixin extends Base {
    // expects `update()` on `this`
    fixSheet() {
      const t0 = (this as any).start("fixSheet");
      try {
        //(this as any).update();
        (this as any).sheet.fixSheet();
      } finally {
        (this as any).finish("fixSheet", t0);
      }
    }
  }
  return Mixin as unknown as Ctor<InstanceType<TBase> & CanFixSheet>;
};
