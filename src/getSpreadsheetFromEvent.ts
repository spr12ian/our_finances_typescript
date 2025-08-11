import { Spreadsheet } from "./Spreadsheet";
import { AllEventsWithSource } from "./types";

export function getSpreadsheetFromEvent(e: AllEventsWithSource): Spreadsheet {
  return new Spreadsheet(e.source);
}
