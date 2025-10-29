// @onEdit.ts
import { FastLog } from "@lib/logging";
import { isProgrammaticEdit } from "@lib/programmaticEditGuard";

export function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  if (!e) return;
  if (isProgrammaticEdit()) return; // Skip internal edits

  const sheet = e.range.getSheet();
  const name = sheet.getName();

  FastLog.log(`onEdit → user edit in ${name} ${e.range.getA1Notation()}`);
  // your user-handling logic here...
}
