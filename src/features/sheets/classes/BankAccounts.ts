import type { Sheet } from "@domain";
import { Spreadsheet } from "@domain";
import { MetaBankAccounts as Meta } from "@lib/constants";
import { logStart } from "@logging";
import { isAccountSheet } from "../accountSheetFunctions";

type FilterSpec = {
  column: number;
  hideValues: string[] | null;
};
export class BankAccounts {
  private readonly sheet: Sheet;

  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheetByMeta(Meta);
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
    const finish = logStart(fn, `: ${this.sheet.name}`);
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
    const finish = logStart(this.showMonthly.name, this.constructor.name);
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
    const finish = logStart(this.showOpenAccounts.name, this.constructor.name);
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

  updateLastUpdatedByKey(key: string) {
    const row = this.sheet.findRowByKey(Meta.COLUMNS.KEY_LABEL, key);

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
}
