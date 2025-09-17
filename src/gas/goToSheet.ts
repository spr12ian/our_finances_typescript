import { getSheetByName } from "./getSheetByName";

export function goToSheet(sheetName: string): void {
  const sheet = getSheetByName(sheetName);

  sheet.activate();
}
