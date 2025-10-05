// src/sheets/core/mixins.ts

import { logStart } from '@lib/logging/FastLog';
import type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";
import { Sheet } from '@domain/Sheet';

export type Ctor<T = {}> = abstract new (...args: any[]) => T;

export const addFixSheet = <T extends object>(obj: T): T & CanFixSheet => {
  return Object.assign(obj, {
    fixSheet() {
      // use methods/fields on obj if needed
      // e.g., (obj as any).sheet.doSomething();
    },
  });
};

export const addFormatSheet = <T extends object>(
  obj: T
): T & CanFormatSheet => {
  return Object.assign(obj, {
    formatSheet() {
      const finish = logStart("formatSheet", "addFormatSheet");
      try {
        (Sheet.prototype.formatSheet as (this: any) => void).call(this);
      } finally {
        finish();
      }
    },
  });
};

export const addTrimSheet = <T extends object>(obj: T): T & CanTrimSheet => {
  return Object.assign(obj, {
    trimSheet() {
      // trim logic
    },
  });
};
