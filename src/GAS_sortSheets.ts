import { Spreadsheet } from "./Spreadsheet";
export function GAS_sortSheets() {
  const spreadsheet = Spreadsheet.getActive();
  spreadsheet.sortSheets();
}
