export interface SpreadsheetSummaryRow {
  sheetName: string;
  lastRow: number;
  lastColumn: number;
  maxRows: number;
  maxColumns: number;
  isAccount: boolean;
  isBudget: boolean;
}
