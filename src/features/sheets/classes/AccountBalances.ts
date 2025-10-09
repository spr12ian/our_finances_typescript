import type { Spreadsheet } from "@domain";
import { MetaAccountBalances as Meta } from "@lib/constants";
import { FastLog, methodStart } from "@logging";
import { BaseSheet } from "../core";

/**
 * Class to handle the "Account balances" sheet.
 */
export class AccountBalances extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    super(Meta.SHEET.NAME, spreadsheet);
  }

  get allValues(): (string | number)[][] {
    return this.sheet.raw.getDataRange().getValues() as (string | number)[][];
  }

  fixSheet(): void {
    const finish = methodStart(this.fixSheet.name, this.constructor.name);
    this.update();
    this.sheet.fixSheet();
    finish();
  }

  update(): void {
    const finish = methodStart(this.update.name, this.constructor.name);
    try {
      const values = this.spreadsheet
        .getSheet("Transactions")
        .getRange("A1:I")
        .getValues() as (string | number | null)[][];

      if (values.length < 2) {
        // No data rows
        this.sheet.raw
          .clearContents()
          .getRange(1, 1, 1, 4)
          .setValues([["Account", "Credit (£)", "Debit (£)", "Nett (£)"]]);
        FastLog.log(
          `Finished AccountBalances.update: ${this.sheet.name} (no data)`
        );
        return;
      }

      const headers = values[0] as string[];
      const data = values.slice(1);

      type Sums = { credit: number; debit: number; nett: number };
      const resultMap = new Map<string, Sums>();

      for (const row of data) {
        const account = String(row[0] ?? "").trim();
        if (!account) continue; // skip blank keys

        const credit = Number(row[3] ?? 0) || 0;
        const debit = Number(row[4] ?? 0) || 0;
        const nett = Number(row[8] ?? 0) || 0;

        const sums = resultMap.get(account) ?? { credit: 0, debit: 0, nett: 0 };
        sums.credit += credit;
        sums.debit += debit;
        sums.nett += nett;
        resultMap.set(account, sums);
      }

      const output: (string | number)[][] = [
        [
          String(headers[0] ?? "Account"),
          String(headers[3] ?? "D"),
          String(headers[4] ?? "E"),
          String(headers[8] ?? "I"),
        ],
      ];

      // Sort accounts alphabetically before output
      const sortedAccounts = Array.from(resultMap.keys()).sort((a, b) =>
        a.localeCompare(b)
      );

      for (const account of sortedAccounts) {
        const sums = resultMap.get(account)!;
        output.push([account, sums.credit, sums.debit, sums.nett]);
      }

      this.sheet.raw
        .clearContents()
        .getRange(1, 1, output.length, 4)
        .setValues(output);
    } finally {
      finish();
    }
  }

  /** Sums credits/debits in C:D starting at row 2. */
  sumCreditsDebits_(sheetName: string): {
    credit: number;
    debit: number;
  } {
    FastLog.log(`Started AccountBalances.sumCreditsDebits_: ${sheetName}`);
    const sheet = this.spreadsheet.getSheet(sheetName);
    const lastRow = sheet.raw.getLastRow();
    if (lastRow < 2) {
      FastLog.log(
        `Finished AccountBalances.sumCreditsDebits_: ${sheetName} (no data)`
      );
      return { credit: 0, debit: 0 };
    }

    // Read only the used rows.
    const numRows = lastRow - 1; // since we start at row 2
    const values = sheet.raw
      .getRange(2, 3, numRows, 2) // (row 2, col C=3, rows, cols=2)
      .getValues() as (number | string)[][];

    let credit = 0;
    let debit = 0;

    for (const [c, d] of values) {
      // In GAS, numbers come as numbers; blanks are usually "".
      if (typeof c === "number") credit += c;
      if (typeof d === "number") debit += d;
      // If you expect strings like "1,234.56", add a parse step:
      // else if (typeof c === 'string' && c) credit += parseFloat(c.replace(/,/g, '')) || 0;
      // else if (typeof d === 'string' && d) debit  += parseFloat(d.replace(/,/g, '')) || 0;
    }

    FastLog.log(
      `Finished AccountBalances.sumCreditsDebits_: ${sheetName} (credit=${credit}, debit=${debit})`
    );
    return { credit, debit };
  }

  updateAccountBalance(sheetName: string): void {
    FastLog.log(`Started AccountBalances.updateAccountBalance: ${sheetName}`);
    const { credit, debit } = this.sumCreditsDebits_(sheetName);
    const nett = credit - debit;
    const accountName = sheetName.slice(1); // remove leading '=' if present
    FastLog.log(
      `Account: ${accountName}, Credit: ${credit}, Debit: ${debit}, Nett: ${nett}`
    );

    const accountRow = this.allValues.findIndex(
      (row) => String(row[0] ?? "").trim() === accountName
    );

    if (accountRow === -1) {
      // Account not found; append a new row.
      const newRow = [accountName, credit, debit, nett];
      this.sheet.raw.appendRow(newRow);
      FastLog.log(`Appended new account row: ${newRow}`);
    } else {
      FastLog.log(`Found existing account row at index ${accountRow}`);
      // Account found; update the existing row.
      const rowIndex = accountRow + 1; // Convert to 1-based index for GAS
      this.sheet.raw
        .getRange(rowIndex, 2, 1, 3)
        .setValues([[credit, debit, nett]]);
      FastLog.log(
        `Updated account row ${
          rowIndex + 1
        }: Credit=${credit}, Debit=${debit}, Nett=${nett}`
      );
    }
    FastLog.log(`Finished AccountBalances.updateAccountBalance: ${sheetName}`);
  }
}
