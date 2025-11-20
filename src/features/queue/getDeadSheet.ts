import { Sheet } from "../../domain/Sheet";
import { DEAD_SHEET_NAME } from "./queueConstants";

export function getDeadSheet(): Sheet {
  const sheet = Sheet.getSheetByName(DEAD_SHEET_NAME);
  if (!sheet) throw new Error("Dead sheet missing. Run queueSetup().");
  return sheet;
}
