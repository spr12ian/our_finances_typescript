import { factoryFromClass } from "@lib/factoryFromClass";
import type {SheetFactory} from "./mixinTypes";
import { createAccountBalances } from './AccountBalances/AccountBalances';
import { BankAccounts } from 'src/BankAccounts';
import { addFixSheet,addFormatSheet,addTrimSheet } from './core';

export const sheetFactories: Record<string, SheetFactory> = {
  "Account balances": createAccountBalances,
  "Bank accounts": factoryFromClass(BankAccounts).with(
    addFixSheet,
    addFormatSheet,
    addTrimSheet
  ),
};
