// getFinancesSpreadsheet.ts
import { Spreadsheet } from "@domain";
import { FastLog, withLog } from "@lib/logging";

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

// Broadest event type that still lets us read .source / .authMode when present
type AnyEvent = GoogleAppsScript.Events.AppsScriptEvent | undefined;

export function getFinancesSpreadsheet(e?: AnyEvent): Spreadsheet {
  const fn = getFinancesSpreadsheet.name;
  FastLog.info(fn, "Called");

  // Per-execution memo
  if (memo.wrapped && memo.gas) {
    FastLog.info(fn, "Using memoized finances spreadsheet");
    return memo.wrapped;
  }

  // Resolve configured ID once
  const sp = PropertiesService.getScriptProperties();
  const up = PropertiesService.getUserProperties();
  const configuredId =
    sp.getProperty("FINANCES_SPREADSHEET_ID") ??
    up.getProperty("FINANCES_SPREADSHEET_ID") ??
    "";
  FastLog.info(
    fn,
    `Configured finances spreadsheet ID: ${
      configuredId ? configuredId : "<none>"
    }`
  );

  const src = (e as any)?.source as
    | GoogleAppsScript.Spreadsheet.Spreadsheet
    | undefined;
  FastLog.info(fn, `Event source spreadsheet ID: ${src?.getId() ?? "<none>"}`);

  // Heuristic: simple triggers don’t expose triggerUid/authMode
  const isSimpleTrigger =
    !e ||
    (typeof (e as any).triggerUid === "undefined" &&
      typeof (e as any).authMode === "undefined");
  FastLog.info(fn, `Is simple trigger: ${isSimpleTrigger}`);

  // Determine active spreadsheet based on trigger type:
  //   - Simple triggers → single cheap call to SpreadsheetApp.getActiveSpreadsheet()
  //   - Non-simple      → defensive backoff wrapper
  // use e.source if present; fall back to active spreadsheet if not
  const active =
    src ??
    (isSimpleTrigger
      ? withLog(fn,SpreadsheetApp.getActiveSpreadsheet)() || null
      : withLog(fn,Spreadsheet.getActiveWithBackoff)() || null);
  FastLog.info(
    fn,
    `Active spreadsheet ID: ${active?.getId() ?? "<none>"}`
  );

  // Fast path: configuredId present and matches active/src
  if (configuredId) {
    if (active && active.getId() === configuredId) {
      FastLog.info(fn, "Using active spreadsheet as finances spreadsheet");
      return wrapAndMemoize(active, configuredId);
    }
    if (
      src &&
      typeof src.getId === "function" &&
      src.getId() === configuredId
    ) {
      FastLog.info(fn, "Using event source spreadsheet as finances spreadsheet");
      return wrapAndMemoize(src, configuredId);
    }
  }

  // No configured ID → prefer event source, else active
  if (!configuredId) {
    if (src && typeof src.getId === "function") {
      FastLog.info(
        fn,
        "No configured ID; using event source spreadsheet as finances spreadsheet"
      );
      return wrapAndMemoize(src);
    }
    if (active) {
      FastLog.info(
        fn,
        "No configured ID; using active spreadsheet as finances spreadsheet"
      );
      return wrapAndMemoize(active);
    }
    throw new Error(
      "FINANCES_SPREADSHEET_ID not set, and no source/active spreadsheet available."
    );
  }

  // We do have an ID, but simple triggers cannot safely open other files by ID.
  if (isSimpleTrigger) {
    if (src && typeof (src as any).getId === "function") {
      FastLog.info(
        fn,
        "Simple trigger: using event source spreadsheet as finances spreadsheet"
      );
      return wrapAndMemoize(src as any);
    }
    if (active) {
      FastLog.info(
        fn,
        "Simple trigger: using active spreadsheet as finances spreadsheet"
      );
      return wrapAndMemoize(active);
    }
    throw new Error("Simple trigger: no source/active spreadsheet available.");
  }

  // Non-simple trigger (installable/manual) → safe to use openByIdWithBackoff
  try {
    const gas = Spreadsheet.openByIdWithBackoff(configuredId);
    FastLog.info(fn, "Opened finances spreadsheet by ID successfully");
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

// Optional: call if you change properties elsewhere and want to force re-read
export function resetFinancesSpreadsheetCache(): void {
  memo.id = undefined;
  memo.gas = undefined;
  memo.wrapped = undefined;
}

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
