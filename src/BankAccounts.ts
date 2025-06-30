class BankAccounts {
  static get COLUMNS() {
    return {
      KEY: 1,
      OWNER_CODE: 3,
      CHECK_BALANCE_FREQUENCY: 12,
      BALANCE_UPDATED: 19,
      KEY_LABEL: 'A'
    }
  };
  static get OWNER_CODES() {
    return {
      BRIAN: 'A',
      CHARLIE: 'C',
      LINDA: 'L'
    }
  };
  static get SHEET() { return { NAME: 'Bank accounts' } };

  constructor() {
    this.sheet = new Sheet(BankAccounts.SHEET.NAME);

    if (!this.sheet) {
      throw new Error(`Sheet '${BankAccounts.SHEET.NAME}' not found.`);
    }
  }

  applyFilters(filters) {
    const sheet = this.sheet;

    // Clear any existing filters
    this.removeFilter();

    const filter = sheet.getDataRange().createFilter();

    filters.forEach(item => {
      const criteria = item.hideValues === null
        ? activeSpreadsheet.newFilterCriteria().whenCellEmpty().build()
        : activeSpreadsheet.newFilterCriteria().setHiddenValues(item.hideValues).build();

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

  hideColumns(columnsToHide) {
    const sheet = this.sheet;
    const ranges = sheet.getRangeList(columnsToHide);

    ranges.getRanges().forEach(range => sheet.hideColumn(range));
  }

  removeFilter() {
    const sheet = this.sheet;
    const existingFilter = sheet.getFilter();
    if (existingFilter) {
      existingFilter.remove();
    }
    return sheet;
  }

  showAll() {
    const sheet = this.sheet;

    this.removeFilter();
    sheet.showColumns(1, sheet.getLastColumn());
    sheet.activate();
  }

  showDaily() {
    this.showAll();
    const colCheckBalanceFrequency = BankAccounts.COLUMNS.CHECK_BALANCE_FREQUENCY;
    const colOwnerCode = BankAccounts.COLUMNS.OWNER_CODE;
    const hideOwnerCodes = [
      BankAccounts.OWNER_CODES.BRIAN,
      BankAccounts.OWNER_CODES.CHARLIE,
      BankAccounts.OWNER_CODES.LINDA,
    ];
    const filters = [
      { column: colOwnerCode, hideValues: hideOwnerCodes },
      { column: colCheckBalanceFrequency, hideValues: ["Monthly", "Never"] }
    ];

    this.applyFilters(filters);

    const columnsToHide = ['C:L', 'N:O', 'Q:Q', 'S:AN', 'AQ:AQ'];
    this.hideColumns(columnsToHide);
  }

  showMonthly() {
    this.showAll();
    const filters = [
      { column: 3, hideValues: ["C", "L"] },  // Filter by Owner Code (Column C)
      { column: 12, hideValues: ["Daily", "Never"] }  // Filter by Check Balance Frequency (Column L)
    ];

    this.applyFilters(filters);

    const columnsToHide = ['C:L', 'N:O', 'Q:Q', 'S:U', 'W:AJ'];
    this.hideColumns(columnsToHide);
  }

  showOpenAccounts() {
    this.showAll();
    const filters = [
      { column: 3, hideValues: ["C", "L"] },  // Filter by Owner Code (Column C)
      { column: 11, hideValues: null }  // Filter by Date Closed (Column K)
    ];

    this.applyFilters(filters);
  }

  updateLastUpdatedByKey(key) {
    const row = findRowByKey(BankAccounts.SHEET.NAME, BankAccounts.COLUMNS.KEY_LABEL, key);


    const lastUpdateCell = this.sheet.getRange(row, BankAccounts.COLUMNS.BALANCE_UPDATED);
    lastUpdateCell.setValue(new Date());
  }

  updateLastUpdatedBySheet(sheet) {
    if (isAccountSheet(sheet)) {
      const key = sheet.getSheetName().slice(1);
      this.updateLastUpdatedByKey(key);
    }
  }
}
