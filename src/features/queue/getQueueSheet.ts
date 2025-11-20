import { Sheet } from "../../domain/Sheet";
import { QUEUE_SHEET_NAME } from "./queueConstants";

export function getQueueSheet(): Sheet {
  const sheet = Sheet.getSheetByName(QUEUE_SHEET_NAME);
  if (!sheet) throw new Error("Queue sheet missing. Run queueSetup().");
  return sheet;
}
