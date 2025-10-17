// types.ts

// 1) Define a base union of known Sheets events.
//    Add to this as you start using more event types.
type SheetsAny =
  | GoogleAppsScript.Events.SheetsOnOpen
  | GoogleAppsScript.Events.SheetsOnEdit
  | GoogleAppsScript.Events.SheetsOnChange
  | GoogleAppsScript.Events.SheetsOnFormSubmit;

// 2) Auto-filter to only those that actually have a Spreadsheet `.source`
export type AllEventsWithSource = Extract<
  SheetsAny,
  { source: GoogleAppsScript.Spreadsheet.Spreadsheet }
>;

export type SpreadsheetT = GoogleAppsScript.Spreadsheet.Spreadsheet;
