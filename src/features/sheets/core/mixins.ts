// src/sheets/core/mixins.ts

import type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";

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
      // formatting logic
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
