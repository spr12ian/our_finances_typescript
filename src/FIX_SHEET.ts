import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { OurFinances } from "./OurFinances";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

export function FIX_SHEET(parameters: ParamsOf<"FIX_SHEET">): void {
  FastLog.log("Started FIX_SHEET", parameters);
  // const { sheetName } = parameters;

  const spreadsheet = getFinancesSpreadsheet();
  const ourFinances = new OurFinances(spreadsheet);
  ourFinances.fixSheet();
  FastLog.log("Finished FIX_SHEET", parameters);
}
