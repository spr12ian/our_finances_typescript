// sheetFactories.ts

import type { Spreadsheet } from "@domain";
import { FastLog } from "@lib/logging";
import type { SheetKey } from "src/constants/sheetNames";
import * as SheetClasses from "./classes";
import type { SheetFactory } from "./sheetFactoryTypes";
import { BaseSheet } from "src/features/sheets/core";

// A constructor for any subclass of BaseSheet
type SheetClassCtor<T extends BaseSheet = BaseSheet> = {
  new (spreadsheet: Spreadsheet): T;
  sheetName: SheetKey;
};

// Map from sheet name → factory that returns some BaseSheet subclass
type FactoryMap = Partial<Record<SheetKey, SheetFactory<BaseSheet>>>;

// Your concrete classes go here
const sheetClassList: SheetClassCtor[] = [
  SheetClasses.Assets,
  SheetClasses.BankAccounts,
  SheetClasses.HMRC_TaxReturn,
  SheetClasses.OurMoney,
];

export const sheetFactories = buildSheetFactories(sheetClassList);
export type FactoryKey = keyof typeof sheetFactories;

/**
 * Turn a sheet class into a factory.
 * T is the concrete subclass of BaseSheet.
 */
function factoryFromClass<T extends BaseSheet>(
  SheetCtor: SheetClassCtor<T>
): SheetFactory<T> {
  return (s: Spreadsheet) => new SheetCtor(s);
}

/**
 * Build the SheetKey → SheetFactory map from the list of classes.
 */
function buildSheetFactories(classes: SheetClassCtor[]): FactoryMap {
  const map: FactoryMap = {};
  for (const C of classes) {
    // factoryFromClass(C) is inferred as SheetFactory<BaseSheet> here,
    // which is compatible with FactoryMap’s value type.
    map[C.sheetName] = factoryFromClass(C);
  }
  return map;
}

export function getSheetFactory(
  name: SheetKey
): SheetFactory<BaseSheet> | undefined {
  return sheetFactories[name as FactoryKey];
}

FastLog.info(
  "sheetFactories",
  `Defined ${Object.keys(sheetFactories).length} sheet factories`
);
