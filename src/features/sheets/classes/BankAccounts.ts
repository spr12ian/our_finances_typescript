import type { Sheet } from "@domain";
import { Spreadsheet } from "@domain";
import { MetaBankAccounts as Meta } from "@lib/constants";
import { FastLog, methodStart, propertyStart } from "@logging";
import { isAccountSheet } from "../accountSheetFunctions";
import { AccountSheet } from "./AccountSheet";
import { AccountSheets } from "./AccountSheets";

type FilterSpec = {
  column: number;
  hideValues: string[] | null;
};
export class BankAccounts {
  #keys?: string[];
  private readonly sheet: Sheet;

  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheetByMeta(Meta);
  }

  get keys(): string[] {
    if (!this.#keys) {
      // skips header
      this.#keys = this.sheet.getColumnData(Meta.COLUMNS.KEY);
    }
    return this.#keys;
  }

  get openAccounts(): any[][] {
    const finish = propertyStart("openAccounts", this.constructor.name);
    try {
      const data = this.getValues();
      const dateClosedIndex = Meta.COLUMNS.DATE_CLOSED - 1; // zero-based index

      const openAccounts = data.filter((row, index) => {
        // Always include the header row
        if (index === 0) return true;
        // Include rows where the Date Closed column is empty
        return !row[dateClosedIndex];
      });

      FastLog.log(
        `Found ${openAccounts.length - 1} open accounts out of ${
          data.length - 1
        } total accounts.`
      );

      return openAccounts;
    } finally {
      finish();
    }
  }

  applyFilters(filters: FilterSpec[]) {
    const sheet = this.sheet;

    // Clear any existing filters
    this.removeFilter();

    const filter = sheet.dataRange.createFilter();

    filters.forEach((item) => {
      const criteria =
        item.hideValues === null
          ? this.spreadsheet.newFilterCriteria().whenCellEmpty().build()
          : this.spreadsheet
              .newFilterCriteria()
              .setHiddenValues(item.hideValues)
              .build();

      filter.setColumnFilterCriteria(item.column, criteria);
    });
  }

  private filterByFrequency(frequency: string) {
    let hideFrequencies: string[] = [];
    let hideOwners: string[] = [];

    switch (frequency) {
      case Meta.FREQUENCY.DAILY:
        hideFrequencies.push(Meta.FREQUENCY.MONTHLY);
        hideFrequencies.push(Meta.FREQUENCY.NEVER);
        hideOwners.push(Meta.OWNER_CODES.BRIAN);
        hideOwners.push(Meta.OWNER_CODES.CHARLIE);
        hideOwners.push(Meta.OWNER_CODES.LINDA_H);
        break;
      case Meta.FREQUENCY.MONTHLY:
        hideFrequencies.push(Meta.FREQUENCY.DAILY);
        hideFrequencies.push(Meta.FREQUENCY.NEVER);
        hideOwners.push(Meta.OWNER_CODES.BRIAN);
        hideOwners.push(Meta.OWNER_CODES.CHARLIE);
        hideOwners.push(Meta.OWNER_CODES.LINDA_H);
        break;
      default:
        throw new Error(`Unexpected frequency: ${frequency}`);
    }

    if (this.sheet.raw.getLastRow() >= 2) {
      const filters: FilterSpec[] = [
        {
          column: Meta.COLUMNS.CHECK_BALANCE_FREQUENCY,
          hideValues: hideFrequencies,
        },
        { column: Meta.COLUMNS.OWNER_CODE, hideValues: hideOwners },
      ];
      this.applyFilters(filters);
    }
  }

  getDataRange() {
    return this.sheet.dataRange;
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  getSheet() {
    return this.sheet;
  }

  getValues() {
    return this.getDataRange().getValues();
  }

  hideColumns(columnsToHide: string[]) {
    const sheet = this.sheet;
    const ranges = sheet.raw.getRangeList(columnsToHide);

    ranges.getRanges().forEach((range) => sheet.hideColumn(range));
  }

  removeFilter() {
    const sheet = this.sheet;
    const existingFilter = sheet.raw.getFilter();
    if (existingFilter) {
      existingFilter.remove();
    }
    return sheet;
  }

  showAll() {
    const gasSpreadsheet = this.spreadsheet.raw;
    const gasSheet = this.sheet.raw;

    this.removeFilter();

    gasSheet.showSheet();
    gasSpreadsheet.setActiveSheet(gasSheet, true);

    gasSheet.showColumns(1, gasSheet.getLastColumn());
  }

  showAllAccounts() {
    this.showAll();
    SpreadsheetApp.flush();
  }

  showDaily() {
    const fn = this.showDaily.name;
    const finish = methodStart(fn, `: ${this.sheet.name}`);
    try {
      const HIDE_COLUMNS = ["C:L", "N:O", "Q:Q", "S:AN", "AQ:AQ"];

      // Reset the view to a known state
      this.showAll();

      // Hide columns relevant to the daily view in one batch
      this.hideColumns(HIDE_COLUMNS);

      this.filterByFrequency(Meta.FREQUENCY.DAILY);
    } finally {
      Spreadsheet.flush(); // single flush at end of the view change
      finish();
    }
  }

  showMonthly() {
    const finish = methodStart(this.showMonthly.name, this.constructor.name);
    try {
      const HIDE_COLUMNS = ["C:L", "N:O", "Q:Q", "S:U", "W:AJ"];

      this.showAll();

      this.hideColumns(HIDE_COLUMNS);

      this.filterByFrequency(Meta.FREQUENCY.MONTHLY);
    } finally {
      Spreadsheet.flush(); // single flush at end of the view change
      finish();
    }
  }

  showOpenAccounts() {
    const finish = methodStart(
      this.showOpenAccounts.name,
      this.constructor.name
    );
    try {
      this.showAll();
      const filters = [
        {
          column: Meta.COLUMNS.OWNER_CODE,
          hideValues: [Meta.OWNER_CODES.CHARLIE, Meta.OWNER_CODES.LINDA_H],
        },
        { column: Meta.COLUMNS.DATE_CLOSED, hideValues: null },
      ];

      this.applyFilters(filters);
    } finally {
      Spreadsheet.flush(); // single flush at end of the view change
      finish();
    }
  }

  updateAllOpenBalances(): void {
    const finish = methodStart(
      this.updateAllOpenBalances.name,
      this.constructor.name
    );
    try {
      const openKeys = this.getOpenKeys();
      if (openKeys.length === 0) {
        FastLog.log("No open accounts to update.");
        return;
      }
      FastLog.log(
        `Updating balances for open accounts: ${openKeys.join(", ")}`
      );

      for (const key of openKeys) {
        this.updateKeyBalance(key);
      }

      FastLog.log("Finished updating all open account balances.");
    } finally {
      finish();
    }
  }

  updateKeyBalance(key: string) {
    const sheetName = `_${key}`;
    const sheet = this.spreadsheet.getSheet(sheetName);
    if (sheet) {
      const accountSheet = new AccountSheet(sheet, this.spreadsheet);
      const balance = accountSheet.currentEndingBalance;

      // Use Utilities.formatString for reliable currency formatting in GAS
      const pretty = Utilities.formatString("£%.2f", balance);

      FastLog.log(
        `Account ${key} (${sheetName}) current ending balance: ${pretty}`
      );


      this.updateBalanceByKey(key, balance);
      this.updateLastUpdatedByKey(key);
    } else {
      FastLog.warn(`No sheet found for account key: ${key}`);
    }
  }

  updateBalanceByKey(key: string, balance: number) {
    const row = this.sheet.findRowByKey(Meta.LABELS.KEY_LABEL, key);

    const balanceCell = this.sheet.raw.getRange(
      row,
      Meta.COLUMNS.BALANCE
    );
    balanceCell.setValue(balance);
  }

  updateLastUpdatedByKey(key: string) {
    const row = this.sheet.findRowByKey(Meta.LABELS.KEY_LABEL, key);

    const lastUpdateCell = this.sheet.raw.getRange(
      row,
      Meta.COLUMNS.BALANCE_UPDATED
    );
    lastUpdateCell.setValue(new Date());
  }

  updateLastUpdatedBySheet(sheet: Sheet) {
    if (isAccountSheet(sheet)) {
      const key = sheet.getSheetName().slice(1);
      this.updateLastUpdatedByKey(key);
    }
  }

  validateKeys(): void {
    const finish = methodStart(this.validateKeys.name, this.constructor.name);
    try {
      // All keys from the 'Bank accounts' sheet (column A, header skipped by .keys)
      const keys = this.keys
        .map((k) => (k ?? "").trim())
        .filter((k) => k.length > 0);
      FastLog.log("Validating bank account keys:", keys);

      if (keys.length === 0) {
        throw new Error("No keys found in bank accounts sheet");
      }
      if (new Set(keys).size !== keys.length) {
        throw new Error("Duplicate keys found in bank accounts sheet");
      }

      // Keys of sheets that start with '_' (returned WITHOUT the underscore)
      const accountSheetKeys = this.accountSheetKeys().map((k) =>
        (k ?? "").trim()
      );
      const bankAccountsSet = new Set(keys);
      const accountSheetsSet = new Set(accountSheetKeys);

      // 1) Every OPEN key must have a corresponding account sheet (i.e., sheet '_'+key exists)
      const openKeys = this.getOpenKeys();
      const openMissingSheets = openKeys.filter(
        (k) => !accountSheetsSet.has(k)
      );
      if (openMissingSheets.length > 0) {
        // Present as sheet names (with underscore) for clarity
        const missingSheetNames = openMissingSheets.map((k) => `_${k}`);
        throw new Error(
          `Missing account sheets for open accounts: ${missingSheetNames.join(
            ", "
          )}`
        );
      }

      // 2) Every underscore-prefixed sheet must have a corresponding row on 'Bank accounts'
      const orphanSheets = accountSheetKeys.filter(
        (k) => !bankAccountsSet.has(k)
      );
      if (orphanSheets.length > 0) {
        // Present as keys and sheet names for clarity
        const orphanSheetNames = orphanSheets.map((k) => `_${k}`);
        throw new Error(
          `Sheets with no matching 'Bank accounts' row: ${orphanSheetNames.join(
            ", "
          )} (missing keys: ${orphanSheets.join(", ")})`
        );
      }

      // warn (not error) if CLOSED keys still have sheets
      const closedKeys = keys.filter((k) => !openKeys.includes(k));
      const closedButHasSheet = closedKeys.filter((k) =>
        accountSheetsSet.has(k)
      );
      if (closedButHasSheet.length) {
        FastLog.warn(
          `Closed accounts still have sheets: ${closedButHasSheet
            .map((k) => "_" + k)
            .join(", ")}`
        );
      }
    } finally {
      finish();
    }
  }

  private accountSheetKeys() {
    const finish = methodStart(
      this.accountSheetKeys.name,
      this.constructor.name
    );
    try {
      const accountSheets = new AccountSheets(this.spreadsheet);
      const accountSheetKeys = accountSheets.accountSheetKeys;
      FastLog.log("accountSheetKeys: ", accountSheetKeys);
      return accountSheetKeys;
    } finally {
      finish();
    }
  }

  getOpenKeys(): string[] {
    const keyIdx = Meta.COLUMNS.KEY - 1;
    // openAccounts includes the header row at [0], so skip it
    return this.openAccounts
      .slice(1)
      .map((row) => String(row[keyIdx] ?? "").trim())
      .filter((k) => k.length > 0);
  }
}
