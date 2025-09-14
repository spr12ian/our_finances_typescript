import { getActiveSheet } from "./getActiveSheet";

export function getActiveSheetName(): string {
  return getActiveSheet().getName();
}
