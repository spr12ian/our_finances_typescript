/// <reference types="google-apps-script" />

export class Trigger {
  constructor(event) {
    this.event = event;
  }
  getColumn() {
    if (!this._column) {
      this._column = this.getRange().getColumn();
    }
    return this._column;
  }
  getOldValue() {
    if (!this._oldValue) {
      this._oldValue = this.event.oldValue;
    }
    return this._oldValue;
  }
  getRange() {
    if (!this._range) {
      this._range = this.event.range;
    }
    return this._range;
  }
  getRow() {
    if (!this._row) {
      this._row = this.getRange().getRow();
    }
    return this._row;
  }
  getSheet() {
    if (!this._sheet) {
      this._sheet = this.getRange().getSheet();
    }
    return this._sheet;
  }
  getSheetName() {
    if (!this._sheetName) {
      this._sheetName = this.getSheet().getName();
    }
    return this._sheetName;
  }
  getValue() {
    if (!this._value) {
      this._value = this.getRange().getValue();
    }
    return this._value;
  }
}
