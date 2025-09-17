// src/sheets/Assets/Assets.ts
import type { Spreadsheet } from "@domain";
import { MetaAssets as Meta } from "@lib/constants";
import {
  type CanFixSheet,
  type CanFormatSheet,
  type CanTrimSheet,
} from "../core/capabilities";
import { Fixable, Formattable, Trimmable } from "../core/capabilityMixins";
import { AssetsCore } from "./AssetsCore";

// ❶ Public-ctor shim (no behavior change)
class CorePublic extends AssetsCore {
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: any) {
    super(name, spreadsheet, sheet);
  }
}

// ❷ Compose on the public-ctor class
class _Assets extends Fixable(Formattable(Trimmable(CorePublic))) {
  // ❸ Keep the final class publicly constructible
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: any) {
    super(name, spreadsheet, sheet);
  }
}

export type Assets = _Assets &
  CanFormatSheet &
  CanTrimSheet &
  CanFixSheet;

export function createAssets(
  spreadsheet: Spreadsheet
): Assets {
  const sheet = spreadsheet.getSheetByMeta(Meta);
  return new _Assets(
    Meta.SHEET.NAME,
    spreadsheet,
    sheet
  ) as Assets;
}
