// src/sheets/account-balances/AccountBalancesCore.ts
import type { Sheet, Spreadsheet } from "@domain";
import { BaseSheet } from "../core/BaseSheet";

export abstract class AccountBalancesCore extends BaseSheet {
  protected constructor(name: string, spreadsheet: Spreadsheet, sheet: Sheet) {
    super(name, spreadsheet, sheet);
  }

  get allValues(): (string | number)[][] {
    return this.sheet.raw.getDataRange().getValues() as (string | number)[][];
  }

  update(): void {
    this.log(`Started AccountBalances.update: ${this.sheet.name}`);

    const values = this.spreadsheet
      .getSheet("Transactions")
      .getRange("A1:I")
      .getValues() as (string | number | null)[][];

    if (values.length < 2) {
      this.sheet.raw
        .clearContents()
        .getRange(1, 1, 1, 4)
        .setValues([["Account", "Credit (£)", "Debit (£)", "Nett (£)"]]);
      this.log(`Finished AccountBalances.update: ${this.sheet.name} (no data)`);
      return;
    }

    const headers = values[0] as string[];
    const data = values.slice(1);

    type Sums = { credit: number; debit: number; nett: number };
    const resultMap = new Map<string, Sums>();

    for (const row of data) {
      const account = String(row[0] ?? "").trim();
      if (!account) continue;
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

    const sorted = Array.from(resultMap.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    for (const account of sorted) {
      const s = resultMap.get(account)!;
      output.push([account, s.credit, s.debit, s.nett]);
    }

    this.sheet.raw
      .clearContents()
      .getRange(1, 1, output.length, 4)
      .setValues(output);

    this.log(`Finished AccountBalances.update: ${this.sheet.name}`);
  }

  protected sumCreditsDebits_(sheetName: string): {
    credit: number;
    debit: number;
  } {
    this.log(`Started AccountBalances.sumCreditsDebits_: ${sheetName}`);
    const sheet = this.spreadsheet.getSheet(sheetName);
    const lastRow = sheet.raw.getLastRow();
    if (lastRow < 2) {
      this.log(
        `Finished AccountBalances.sumCreditsDebits_: ${sheetName} (no data)`
      );
      return { credit: 0, debit: 0 };
    }
    const numRows = lastRow - 1;
    const values = sheet.raw.getRange(2, 3, numRows, 2).getValues() as (
      | number
      | string
    )[][];
    let credit = 0,
      debit = 0;
    for (const [c, d] of values) {
      if (typeof c === "number") credit += c;
      if (typeof d === "number") debit += d;
    }
    this.log(
      `Finished AccountBalances.sumCreditsDebits_: ${sheetName} (credit=${credit}, debit=${debit})`
    );
    return { credit, debit };
  }

  updateAccountBalance(sheetName: string): void {
    this.log(`Started AccountBalances.updateAccountBalance: ${sheetName}`);
    const { credit, debit } = this.sumCreditsDebits_(sheetName);
    const nett = credit - debit;
    const accountName = sheetName.slice(1);
    this.log(
      `Account: ${accountName}, Credit: ${credit}, Debit: ${debit}, Nett: ${nett}`
    );

    const rows = this.allValues;
    const idx = rows.findIndex(
      (r) => String(r[0] ?? "").trim() === accountName
    );

    if (idx === -1) {
      const newRow = [accountName, credit, debit, nett];
      this.sheet.raw.appendRow(newRow);
      this.log(`Appended new account row: ${newRow}`);
    } else {
      const rowIndex = idx + 1; // GAS 1-based
      this.sheet.raw
        .getRange(rowIndex, 2, 1, 3)
        .setValues([[credit, debit, nett]]);
      this.log(
        `Updated account row ${
          rowIndex + 1
        }: Credit=${credit}, Debit=${debit}, Nett=${nett}`
      );
    }
    this.log(`Finished AccountBalances.updateAccountBalance: ${sheetName}`);
  }
}
