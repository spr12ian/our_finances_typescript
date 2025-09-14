// src/sheets/account-balances/AccountBalances.ts
import { MetaAccountBalances as Meta } from "../../../constants";
import type { Spreadsheet } from "../../../Spreadsheet";
import { AccountBalancesCore } from "./AccountBalancesCore";
import {
  Formattable, Trimmable, Fixable, Queueable,
  type CanFormatSheet, type CanTrimSheet, type CanFixSheet, type QueueOps
} from "../core/capabilityMixins";

// ❶ Public-ctor shim (no behavior change)
class CorePublic extends AccountBalancesCore {
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: any) {
    super(name, spreadsheet, sheet);
  }
}

// ❷ Compose on the public-ctor class
class _AccountBalances extends Queueable(
  Fixable(Formattable(Trimmable(CorePublic)))
) {
  // ❸ Keep the final class publicly constructible
  public constructor(name: string, spreadsheet: Spreadsheet, sheet: any) {
    super(name, spreadsheet, sheet);
  }
}

export type AccountBalances =
  _AccountBalances & CanFormatSheet & CanTrimSheet & CanFixSheet & QueueOps;

export function createAccountBalances(spreadsheet: Spreadsheet): AccountBalances {
  const sheet = spreadsheet.getSheetByMeta(Meta);
  return new _AccountBalances(Meta.SHEET.NAME, spreadsheet, sheet) as AccountBalances;
}
