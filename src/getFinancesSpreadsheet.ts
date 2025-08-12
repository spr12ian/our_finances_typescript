// getFinancesSpreadsheet.ts
/// <reference types="google-apps-script" />
import { Spreadsheet } from "./Spreadsheet";

// Broadest event type that still lets us read .source / .authMode when present
type AnyEvent = GoogleAppsScript.Events.AppsScriptEvent | undefined;

// ────────────────────────────────────────────────────────────
// Per-execution memoization
// GAS provides a fresh VM per execution, but within one execution this helps
// repeated calls (menu paths, composed functions, tests).
// ────────────────────────────────────────────────────────────
const memo: {
  id?: string; // FINANCES_SPREADSHEET_ID we resolved for this execution
  gas?: GoogleAppsScript.Spreadsheet.Spreadsheet; // underlying GAS Spreadsheet
  wrapped?: Spreadsheet; // your wrapper
} = {};

function wrapAndMemoize(
  gas: GoogleAppsScript.Spreadsheet.Spreadsheet,
  id?: string
): Spreadsheet {
  // If we already wrapped this exact object, reuse it.
  if (memo.gas === gas && memo.wrapped) return memo.wrapped;
  memo.gas = gas;
  memo.id = id ?? gas.getId();
  memo.wrapped = new Spreadsheet(gas);
  return memo.wrapped;
}

// Optional: call if you change properties elsewhere and want to force re-read
export function resetFinancesSpreadsheetCache(): void {
  memo.id = undefined;
  memo.gas = undefined;
  memo.wrapped = undefined;
}

export function getFinancesSpreadsheet(e?: AnyEvent): Spreadsheet {
  // Fastest path: if we’ve already resolved this during this execution, return it.
  if (memo.wrapped && memo.gas) return memo.wrapped;

  // Resolve configured ID once
  const sp = PropertiesService.getScriptProperties();
  const up = PropertiesService.getUserProperties();
  const configuredId =
    sp.getProperty("FINANCES_SPREADSHEET_ID") ??
    up.getProperty("FINANCES_SPREADSHEET_ID") ??
    "";

  // Candidate sources that don’t require extra scopes
  const active = SpreadsheetApp.getActiveSpreadsheet() || null;
  const src = (e as any)?.source as
    | GoogleAppsScript.Spreadsheet.Spreadsheet
    | undefined;

  // Fast path: configuredId present and matches active/src
  if (configuredId) {
    if (active && active.getId() === configuredId) {
      return wrapAndMemoize(active, configuredId);
    }
    if (
      src &&
      typeof src.getId === "function" &&
      src.getId() === configuredId
    ) {
      return wrapAndMemoize(src, configuredId);
    }
  }

  // No configured ID → prefer event source, else active
  if (!configuredId) {
    if (src && typeof src.getId === "function") {
      return wrapAndMemoize(src);
    }
    if (active) {
      return wrapAndMemoize(active);
    }
    throw new Error(
      "FINANCES_SPREADSHEET_ID not set, and no source/active spreadsheet available."
    );
  }

  // We do have an ID, but neither active nor src match → need openById.
  // Simple triggers (onOpen/onEdit/onChange simple) cannot open other files.
  // Heuristics: simple triggers lack triggerUid and authMode.
  const isSimpleTrigger =
    !!e &&
    typeof (e as any).triggerUid === "undefined" &&
    typeof (e as any).authMode === "undefined";

  if (isSimpleTrigger) {
    throw new Error(
      "Invoked by a simple trigger, but FINANCES_SPREADSHEET_ID points to a different file. Use an installable trigger."
    );
  }

  try {
    const gas = SpreadsheetApp.openById(configuredId); // requires scopes
    return wrapAndMemoize(gas, configuredId);
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    if (/Required permissions|insufficient|not granted/i.test(msg)) {
      throw new Error(
        "Not authorized to open the finances spreadsheet. Run a function from the editor once to grant permissions, or invoke via an installable trigger."
      );
    }
    if (/no item with the given id|invalid/i.test(msg)) {
      throw new Error(
        `FINANCES_SPREADSHEET_ID appears invalid or inaccessible: ${configuredId}`
      );
    }
    throw err;
  }
}
