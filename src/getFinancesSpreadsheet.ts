// getFinancesSpreadsheet.ts
import { Spreadsheet } from "./Spreadsheet";

type AnyEvent = GoogleAppsScript.Events.AppsScriptEvent;

export function getFinancesSpreadsheet(e?: AnyEvent): Spreadsheet {
  const scriptProps = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();

  const id =
    scriptProps.getProperty("FINANCES_SPREADSHEET_ID") ??
    userProps.getProperty("FINANCES_SPREADSHEET_ID") ??
    "";

  const active = SpreadsheetApp.getActiveSpreadsheet() || null;
  const src = (e as any)?.source as
    | GoogleAppsScript.Spreadsheet.Spreadsheet
    | undefined;

  // Fast path: if active/src exists and matches the configured ID, use it.
  if (id) {
    if (active && active.getId() === id) {
      return new Spreadsheet(active);
    }
    if (src && src.getId && src.getId() === id) {
      return new Spreadsheet(src);
    }
  }

  // If no ID configured, prefer event source (installable or menu), else active bound.
  if (!id) {
    if (src && typeof src.getId === "function") {
      return new Spreadsheet(src);
    }
    if (active) {
      return new Spreadsheet(active);
    }
    throw new Error(
      "FINANCES_SPREADSHEET_ID not set, and no source/active spreadsheet available."
    );
  }

  // We have an ID but it's not the active/src sheet → need openById.
  const isSimpleTrigger = !!e && typeof (e as any).triggerUid === "undefined";
  if (isSimpleTrigger) {
    // Simple triggers can’t open other files even with scopes.
    throw new Error(
      "This was invoked by a simple trigger, but FINANCES_SPREADSHEET_ID points to a different file. Use an installable trigger."
    );
  }

  try {
    const gas = SpreadsheetApp.openById(id); // authorized contexts only
    return new Spreadsheet(gas);
  } catch (err: any) {
    if (/Required permissions|insufficient|not granted/i.test(err?.message)) {
      throw new Error(
        "Not authorized to open the finances spreadsheet. Run a function from the editor once to grant permissions, or invoke via an installable trigger."
      );
    }
    throw err;
  }
}
