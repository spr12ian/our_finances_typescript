import { getSheets } from "./getSheets";

export function getSheetNames(): string[] {
  const sheetNames: string[] = [];
  const sheets = getSheets();
  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    sheetNames.push(sheetName);
  }
  return sheetNames;
}
