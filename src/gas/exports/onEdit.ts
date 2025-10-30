// @onEdit.ts
import { FastLog } from "@lib/logging";
import { isProgrammaticEdit } from "@lib/programmaticEditGuard";

export function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  if (!e) {
    FastLog.log("onEdit → No event object found");
    return;
  }
  if (isProgrammaticEdit()) {
    FastLog.log("onEdit → Skipping programmatic edit");
    return;
  }

  FastLog.logTime("onEdit → User edit detected");
  const sheet = e.range.getSheet();
  FastLog.logTime("onEdit → after getSheet() call");
  const name = sheet.getName();

  FastLog.logTime(`onEdit → user edit in ${name} ${e.range.getA1Notation()}`);
  // your user-handling logic here...
}
