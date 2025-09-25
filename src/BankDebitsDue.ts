/// <reference types="google-apps-script" />
import type { Sheet, Spreadsheet } from "@domain";
import { asNumber } from "./lib/asNumber";
import { getAmountAsGBP } from "./lib/money";
import { xLookup } from "./lib/xLookup";
import type { BankDebitDueRow } from '@sheets/budgetTypes';

export class BankDebitsDue {
  private readonly sheet: Sheet;
  private _howManyDaysAhead?: number;

  static readonly COL_ACCOUNT_KEY = 0;
  static readonly COL_CHANGE_AMOUNT = 1;

  static readonly SHEET = { NAME: "Bank debits due" as const };

  constructor(spreadsheet: Spreadsheet) {
    try {
      this.sheet = spreadsheet.getSheet(BankDebitsDue.SHEET.NAME);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : `Unknown error accessing '${BankDebitsDue.SHEET.NAME}'`;
      throw new Error(`Sheet initialization failed: ${msg}`);
    }
  }

  /** Value from the sheet: F:G with "Look ahead" label */
  get howManyDaysAhead(): number {
    if (typeof this._howManyDaysAhead === "undefined") {
      const searchValue = "Look ahead";
      const foundValue = asNumber(xLookup(searchValue, this.sheet, "F", "G"));
      if (foundValue === null) {
        throw new Error(
          `No number found for '${searchValue}' in column F of the sheet '${BankDebitsDue.SHEET.NAME}'.`
        );
      }
      this._howManyDaysAhead = foundValue;
    }
    return this._howManyDaysAhead;
  }

  /** Headerless data rows (preferred over dataRange.getValues().slice(1)) */
  private get dataRows(): any[][] {
    return this.sheet.dataRows;
  }

  /** Core: return structured rows; leave string formatting to caller */
  getUpcomingDebitsSummary(): BankDebitDueRow[] {
    const rows: BankDebitDueRow[] = [];

    for (const r of this.dataRows) {
      const accountKey = String(r[BankDebitsDue.COL_ACCOUNT_KEY] ?? "").trim();
      const changeAmount = asNumber(r[BankDebitsDue.COL_CHANGE_AMOUNT]) ?? 0;

      if (!accountKey) continue;
      if (Math.abs(changeAmount) <= 1) continue;

      rows.push({
        account: accountKey,
        amount: getAmountAsGBP(changeAmount),
      });
    }

    return rows;
  }
}

/** Optional helper to render the section text (keep UI outside the class) */
export function renderBankDebitsDueSection(
  rows: BankDebitDueRow[],
  lookaheadDays: number
): string {
  if (!rows.length) return "";
  let s = `Due in the next ${lookaheadDays} days:`;
  for (const r of rows) {
    s += `\n\t${r.account} ${r.amount}`;
  }
  return s;
}
