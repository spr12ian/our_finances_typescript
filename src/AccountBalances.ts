import { MetaAccountBalances as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { FastLog } from "./support/FastLog";

/**
 * Class to handle the "Account balances" sheet.
 */
export class AccountBalances {
  private readonly sheet: Sheet;

  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheetByMeta(Meta);
  }

  fixSheet() {
    FastLog.log(`Started AccountBalances.fixSheet: ${this.sheet.name}`);
    this.update();
    this.sheet.fixSheet();
    FastLog.log(`Finished AccountBalances.fixSheet: ${this.sheet.name}`);
  }

  update() {
    FastLog.log(`Started AccountBalances.update: ${this.sheet.name}`);

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

    FastLog.log(`Finished AccountBalances.update: ${this.sheet.name}`);
  }
}
