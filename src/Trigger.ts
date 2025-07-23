/// <reference types="google-apps-script" />
type AppsScriptEvent =
  | GoogleAppsScript.Events.SheetsOnEdit
  | GoogleAppsScript.Events.SheetsOnOpen
  | GoogleAppsScript.Events.SheetsOnFormSubmit
  | GoogleAppsScript.Events.TimeDriven
  | GoogleAppsScript.Events.DoGet
  | GoogleAppsScript.Events.DoPost
  | GoogleAppsScript.Events.CalendarEventUpdated;

export class Trigger {
  private event:AppsScriptEvent;
  private _column?:number;
  private _oldValue?:any;
  constructor(event:AppsScriptEvent) {
    this.event = event;
  }
  get column() {
    if (!this._column) {
      this._column = this.getRange().getColumn();
    }
    return this._column;
  }
  get oldValue() {
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
