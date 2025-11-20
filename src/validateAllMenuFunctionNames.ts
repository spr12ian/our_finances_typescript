// src/dev/validateMenuFunctions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildGasMenu } from "@gas/menus/buildGasMenu";
import { buildSectionsMenu } from "@gas/menus/buildSectionsMenu";

const BUILDERS = [buildGasMenu, buildSectionsMenu];

const IGNORE_NAMES: string[] = ["handleChange", "onEdit", "onOpen"]; // Simple triggers
IGNORE_NAMES.push("dailySorts"); // Trigger
IGNORE_NAMES.push("exportFormulasToDrive"); // Manual, replacing some formulas ongoing
IGNORE_NAMES.push("helloWorld"); // Manual, to test build
IGNORE_NAMES.push("onEditTrigger"); // Trigger
IGNORE_NAMES.push("onOpenTrigger"); // Trigger
IGNORE_NAMES.push("queuePurgeOldData"); // Trigger
IGNORE_NAMES.push("queueWorker"); // Trigger
IGNORE_NAMES.push("sendDailyHtmlEmail"); // Trigger

type Item = { caption: string; functionName: string };
type MenuLike = GoogleAppsScript.Base.Menu & {
  name: string;
  items: Item[];
  submenus: RecordingMenu[];
};
// Accept both zero-arg and (ui) builders
export type MenuBuilder = (ui: GoogleAppsScript.Base.Ui) => void;

class RecordingMenu implements MenuLike {
  public items: Item[] = [];
  public submenus: RecordingMenu[] = [];
  constructor(public readonly name: string) {}
  addItem(caption: string, functionName: string): RecordingMenu {
    this.items.push({ caption, functionName });
    return this;
  }
  addSeparator(): RecordingMenu {
    return this;
  }
  addSubMenu(menu: RecordingMenu): RecordingMenu {
    this.submenus.push(menu);
    return this;
  }
  addToUi(): void {
    /* no-op */
  }
}

class RecordingUi {
  public menus: RecordingMenu[] = [];
  createMenu(name: string): RecordingMenu {
    const m = new RecordingMenu(name);
    this.menus.push(m);
    return m;
  }

  // Optional: some builders call createAddonMenu()
  createAddonMenu(name: string): RecordingMenu {
    return this.createMenu(name);
  }

  // No-ops to be safe if something calls them
  showSidebar(_output: GoogleAppsScript.HTML.HtmlOutput): void {}
  showModalDialog(
    _output: GoogleAppsScript.HTML.HtmlOutput,
    _title: string
  ): void {}
  showModelessDialog(
    _output: GoogleAppsScript.HTML.HtmlOutput,
    _title: string
  ): void {}

  // Keep alert/prompt stubs so accidental calls won’t crash your build
  alert(_msg?: string): GoogleAppsScript.Base.Button {
    return GoogleAppsScript.Base.Button.CLOSE;
  }
  prompt(
    _title?: string,
    _msg?: string,
    _buttons?: GoogleAppsScript.Base.ButtonSet
  ): GoogleAppsScript.Base.PromptResponse {
    throw new Error("prompt() not supported in validator");
  }
}

function collectFunctionNames(m: RecordingMenu, out: Set<string>): void {
  m.items.forEach((i) => out.add(i.functionName));
  m.submenus.forEach((sm) => collectFunctionNames(sm, out));
}

export type ValidateOptions = {
  /** Ignore these exact exported names when computing "unused". */
  ignoreNames?: string[];
  /** Ignore any exported name that starts with one of these prefixes. */
  ignorePrefixes?: string[];
  /**
   * If true, include non-function exports in the "unused" scan.
   * Default: false (menus can only call functions).
   */
  includeNonFunctions?: boolean;
};

export function validateAllMenuFunctionNames() {
  validateMenuFunctionNames(BUILDERS, {
    ignoreNames: IGNORE_NAMES,
    ignorePrefixes: ["test_", "_dev"],
    // includeNonFunctions: true, // set if you also expose constants you want flagged
  });
}
/**
 * Validate that every function name referenced by your menu builders exists
 * and is exported; also flag exported globals that no menu item references.
 */
function validateMenuFunctionNames(
  builders: MenuBuilder[],
  options: ValidateOptions = {}
) {
  const {
    ignoreNames = [],
    ignorePrefixes = [],
    includeNonFunctions = false,
  } = options;
  const FastLog = (globalThis as any).FastLog ?? {
    log: console.log,
    start: () => Date.now(),
    finish: (_: string) => {},
  };

  // 1) Record menu building
  const realGetUi = (SpreadsheetApp as any).getUi;
  const recorder = new RecordingUi();
  // Cast so TypeScript is happy; at runtime we only need createMenu/addItem/...
  (SpreadsheetApp as any).getUi = () =>
    recorder as unknown as GoogleAppsScript.Base.Ui;

  try {
    const t0 = Date.now();
    for (const build of builders) {
      try {
        build(recorder as unknown as GoogleAppsScript.Base.Ui);
      } catch (e) {
        FastLog.log("⚠️ Menu builder threw:", (e as Error)?.message ?? e);
      }
    }

    // Names referenced by addItem()
    const usedFnNames = new Set<string>();
    recorder.menus.forEach((m) => collectFunctionNames(m, usedFnNames));

    // 2) Exported globals (prefer your generated list)
    const exported: string[] =
      (globalThis as any).__exportedGlobals__ ?? Object.keys(globalThis as any);

    const exportedSet = new Set(exported);

    // 3) Missing: referenced in menus but not exported
    const missing = [...usedFnNames].filter((fn) => !exportedSet.has(fn));

    // 4) Unused: exported but never mentioned by any addItem()
    const ignore = new Set(ignoreNames);
    const ignoreByPrefix = (n: string) =>
      ignorePrefixes.some((p) => n.startsWith(p));

    const isCallable = (n: string) =>
      typeof (globalThis as any)[n] === "function";

    const candidate = (n: string) =>
      !ignore.has(n) &&
      !ignoreByPrefix(n) &&
      (includeNonFunctions || isCallable(n));

    const unused = exported.filter((n) => candidate(n) && !usedFnNames.has(n));

    // 5) Logs
    FastLog.log(
      "🧩 Used function names:",
      [...usedFnNames].sort().join(", ") || "— none —"
    );
    missing.length
      ? FastLog.log(
          "⚠️ Missing (referenced in menus but not exported):",
          missing.sort().join(", ")
        )
      : FastLog.log("✅ All menu function names are exported.");

    unused.length
      ? FastLog.log(
          "ℹ️ Unused exports (exported but never referenced by menus):",
          unused.sort().join(", ")
        )
      : FastLog.log("✅ No unused exported globals (given filters).");

    return {
      ok: missing.length === 0,
      used: [...usedFnNames].sort(),
      missing: missing.sort(),
      unused: unused.sort(),
      exportedCount: exported.length,
      elapsedMs: Date.now() - t0,
    };
  } finally {
    (SpreadsheetApp as any).getUi = realGetUi;
  }
}
