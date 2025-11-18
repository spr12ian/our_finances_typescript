// getExtendedSheet.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { isAccountSheetName } from "./accountSheetFunctions";
import { AccountSheet } from "./classes/AccountSheet";
import { createGenericSheet } from "./classes/GenericSheet";
import { getSheetFactory as getRegisteredSheetFactory } from "./sheetFactories";
import { sheetNames, type SheetKey } from "src/constants/sheetNames";
import type { ExtendedSheet, SheetFactory } from "./sheetTypes";

/**
 * Runtime guard: is this string one of our known SheetKey literals?
 */
function isSheetKey(name: string): name is SheetKey {
  // `sheetNames` is `readonly string[]` (or `readonly [...,] as const`)
  return (sheetNames as readonly string[]).includes(name);
}

export function getExtendedSheet(sheetName: string): ExtendedSheet {
  const fn = getExtendedSheet.name;
  const startTime = FastLog.start(fn, sheetName);

  try {
    const spreadsheet = getFinancesSpreadsheet();

    // Special handling for account sheets
    if (isAccountSheetName(sheetName)) {
      const sheet = spreadsheet.getSheet(sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return new AccountSheet(sheet, spreadsheet);
    }

    // For everything else, resolve via registry + fallback
    const factory = resolveSheetFactory(sheetName);
    return factory(spreadsheet);
  } catch (err) {
    FastLog.error(fn, err);
    throw new Error(`${fn}: ${getErrorMessage(err)}`);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}

/**
 * Resolve a factory for a given sheet:
 * 1. If it's a known SheetKey, try the registered factory (BaseSheet subclasses)
 * 2. If none exists, fall back to a GenericSheet factory
 */
function resolveSheetFactory(sheetName: string): SheetFactory {
  const fn = resolveSheetFactory.name;
  const startTime = FastLog.start(fn, sheetName);

  try {
    // Try the strongly-typed registry first (only for known SheetKey names)
    if (isSheetKey(sheetName)) {
      const registered = getRegisteredSheetFactory(sheetName);
      if (registered) {
        // Bridge from "SheetFactory<BaseSheet>" to your
        // local "SheetFactory" that returns ExtendedSheet.
        return registered as unknown as SheetFactory;
      }
    }

    // Fallback: dynamically build a GenericSheet factory
    return createGenericSheet(sheetName);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
