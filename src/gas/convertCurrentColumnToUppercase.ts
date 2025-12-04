import { withLog } from "@lib/logging";
import { convertColumnToUppercase } from "./convertColumnToUppercase";
import { getActiveSheet } from "./getActiveSheet";

export function convertCurrentColumnToUppercase() {
  const sheet = getActiveSheet();
  const activeRange = sheet.getActiveRange();

  if (!activeRange) {
    throw new Error("No active range selected.");
  }

  const START_ROW = 2;
  const column = activeRange.getColumn();

  withLog(convertColumnToUppercase)(sheet, column, START_ROW);
}
