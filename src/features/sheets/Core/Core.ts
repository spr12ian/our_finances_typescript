// src/sheets/Core/Core.ts
import type { Sheet, Spreadsheet } from "@domain";
import { type CanFixSheet, type CanFormatSheet } from "../core/capabilities";
import { Fixable, Formattable } from "../core/capabilityMixins";
import { CoreCore } from "./CoreCore";

// ❶ Public-ctor shim (no behavior change)
class CorePublic extends CoreCore {
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: Sheet) {
    super(name, spreadsheet, sheet);
  }
}

// ❷ Compose on the public-ctor class
class _Core extends Fixable(Formattable(CorePublic)) {
  // ❸ Keep the final class publicly constructible
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: Sheet) {
    super(name, spreadsheet, sheet);
  }
}

export type Core = _Core & CanFormatSheet & CanFixSheet;

export function createCoreFactory(sheetName: string) {
  return (spreadsheet: Spreadsheet): Core => {
    const sheet = spreadsheet.getSheet(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
    return new _Core(sheetName, spreadsheet, sheet) as Core;
  };
}
