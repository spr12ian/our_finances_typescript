/// <reference types="google-apps-script" />

export class Sheet {
  constructor(x = null) {

    const xType = getType(x);

    if (xType === 'string') {
      const sheetName = x;

      this.sheet = activeSpreadsheet.getSheetByName(sheetName);
      if (!this.sheet) {
        throw new Error(`Sheet with name "${sheetName}" not found`);
      }
      return;
    }

    if (xType === 'Object') {
      const gasSheet = x;
      this.sheet = gasSheet;
      return;
    }

    if (x === null) {
      this.sheet = activeSpreadsheet.getActiveSheet();
      if (!this.sheet) {
        this.sheet = null;
      }
      return;
    }

    // Handle unexpected types
    throw new TypeError(`Unexpected input type: ${xType}`);
  }

  get spreadsheet() {
    if (!this._spreadsheet) {
      this._spreadsheet = new Spreadsheet(this.sheet.getParent().getId());
    }
    return this._spreadsheet;
  }

  get spreadsheetName() {
    if (!this._spreadsheetName) {
      this._spreadsheetName = this.spreadsheet.spreadsheetName;
    }
    return this._spreadsheetName;
  }

  activate() {
    this.sheet.activate();
  }

  clear() {
    this.sheet.clear();
  }

  clearContents() {
    this.sheet.clearContents();
  }

  deleteExcessColumns() {
    const frozenColumns = this.sheet.getFrozenColumns();
    const lastColumn = this.sheet.getLastColumn();
    const maxColumns = this.sheet.getMaxColumns();

    // Determine the start column for deletion
    const startColumn = Math.max(lastColumn + 1, frozenColumns + 2);

    const howManyColumnsToDelete = 1 + maxColumns - startColumn;

    if (howManyColumnsToDelete > 0) {
      this.sheet.deleteColumns(startColumn, howManyColumnsToDelete);
    }
  }

  deleteExcessRows() {
    const frozenRows = this.sheet.getFrozenRows()
    const lastRow = this.sheet.getLastRow();
    let startRow = lastRow + 1
    if (lastRow <= frozenRows) {
      startRow = frozenRows + 2;
    }
    const maxRows = this.sheet.getMaxRows()
    const howManyRowsToDelete = 1 + maxRows - startRow

    if (maxRows > startRow) {
      this.sheet.deleteRows(startRow, howManyRowsToDelete);
    }
  }

  deleteRows(startRow, howManyRowsToDelete) {
    this.sheet.deleteRows(startRow, howManyRowsToDelete);
  }

  getDataRange() {
    return this.sheet.getDataRange();
  }

  getFilter() {
    return this.sheet.getFilter()
  }

  getFrozenColumns() {
    return this.sheet.getFrozenColumns()
  }

  getFrozenRows() {
    return this.sheet.getFrozenRows()
  }

  getLastColumn() {
    return this.sheet.getLastColumn();
  }

  getLastRow() {
    return this.sheet.getLastRow();
  }

  getName() {
    return this.sheet.getName();
  }

  getMaxColumns() {
    return this.sheet.getMaxColumns();
  }

  getMaxRows() {
    return this.sheet.getMaxRows();
  }

  getParent() {
    return this.sheet.getParent();
  }

  getRange(...args) {
    return this.sheet.getRange(...args);
  }

  getRangeList(...args) {
    return this.sheet.getRangeList(...args);
  }

  getSheetId() {
    return this.sheet.getSheetId();
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  getValue(range) {
    return this.getRange(range).getValue();
  }

  hideColumn(...args) {
    return this.sheet.hideColumn(...args)
  }

  setActiveCell(...args) {
    this.sheet.setActiveCell(...args)
  }

  setActiveRange(range) {
    this.sheet.setActiveRange(range);
  }

  setColumnWidth(column, width) {
    return this.sheet.setColumnWidth(column, width)
  }

  setSheetByName(sheetName) {
    this.spreadsheet = activeSpreadsheet;
    this.sheet = activeSpreadsheet.getSheetByName(sheetName);

    if (!this.sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }
  }

  setValue(range, value) {
    return this.getRange(range).setValue(value);
  }

  showColumns(...args) {
    return this.sheet.showColumns(...args);
  }

  trimSheet() {
    this.deleteExcessColumns();
    this.deleteExcessRows();
    return this;
  }
}
