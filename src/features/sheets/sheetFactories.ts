import { factoryFromClass } from "@lib/factoryFromClass";
import { BankAccounts } from "src/BankAccounts";
import { createAccountBalances } from "./AccountBalances/AccountBalances";
import { createAssets } from "./Assets/Assets"
import { addFixSheet, addFormatSheet, addTrimSheet } from "./core";
import type { SheetFactory } from "./mixinTypes";

export const sheetFactories: Record<string, SheetFactory> = {
  "Account balances": createAccountBalances,
  "Assets": createAssets,
  "Bank accounts": factoryFromClass(BankAccounts).with(
    addFixSheet,
    addFormatSheet,
    addTrimSheet
  ),
};
