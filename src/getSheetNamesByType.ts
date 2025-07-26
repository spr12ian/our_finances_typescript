import { Spreadsheet } from './Spreadsheet';
import { SpreadsheetSummary } from './SpreadsheetSummary';

export function getSheetNamesByType(sheetNameType: string) {
  let sheetNames;
  // Process based on sheetNameType
  switch (sheetNameType) {
    case "account":
      sheetNames = accountSheetNames;
      break;
    case "all":
      const spreadsheet = Spreadsheet.getActive();

      const spreadsheetSummary = new SpreadsheetSummary(spreadsheet);
      // Return all sheet names
      sheetNames = spreadsheetSummary.getSheetNames();
      break;
    default:
      throw new Error(`Unexpected sheetNameType: ${sheetNameType}`);
  }
  return sheetNames;
}
