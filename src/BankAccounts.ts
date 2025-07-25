import { MetaBankAccounts as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
type FilterSpec = {
  column: number;
  hideValues: string[] | null;
};
export class BankAccounts {
  private readonly sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  applyFilters(filters: FilterSpec[]) {
    const sheet = this.sheet;

    // Clear any existing filters
    this.removeFilter();

    const filter = sheet.getDataRange().createFilter();

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

  getDataRange() {
    return this.sheet.getDataRange();
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
    const sheet = this.sheet;

    this.removeFilter();
    sheet.showColumns(1, sheet.raw.getLastColumn());
    sheet.activate();
  }

  showDaily() {
    this.showAll();
    const colCheckBalanceFrequency = Meta.COLUMNS.CHECK_BALANCE_FREQUENCY;
    const colOwnerCode = Meta.COLUMNS.OWNER_CODE;
    const hideOwnerCodes = [
      Meta.OWNER_CODES.BRIAN,
      Meta.OWNER_CODES.CHARLIE,
      Meta.OWNER_CODES.LINDA,
    ];
    const filters = [
      { column: colOwnerCode, hideValues: hideOwnerCodes },
      { column: colCheckBalanceFrequency, hideValues: ["Monthly", "Never"] },
    ];

    this.applyFilters(filters);

    const columnsToHide = ["C:L", "N:O", "Q:Q", "S:AN", "AQ:AQ"];
    this.hideColumns(columnsToHide);
  }

  showMonthly() {
    this.showAll();
    const filters = [
      { column: 3, hideValues: ["C", "L"] }, // Filter by Owner Code (Column C)
      { column: 12, hideValues: ["Daily", "Never"] }, // Filter by Check Balance Frequency (Column L)
    ];

    this.applyFilters(filters);

    const columnsToHide = ["C:L", "N:O", "Q:Q", "S:U", "W:AJ"];
    this.hideColumns(columnsToHide);
  }

  showOpenAccounts() {
    this.showAll();
    const filters = [
      { column: 3, hideValues: ["C", "L"] }, // Filter by Owner Code (Column C)
      { column: 11, hideValues: null }, // Filter by Date Closed (Column K)
    ];

    this.applyFilters(filters);
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
    if (sheet.isAccountSheet()) {
      const key = sheet.getSheetName().slice(1);
      this.updateLastUpdatedByKey(key);
    }
  }
}
