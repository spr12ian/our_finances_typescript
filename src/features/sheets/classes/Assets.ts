import type { Spreadsheet } from "@domain";
import { MetaAssets as Meta } from "@lib/constants";
import { WithLog } from "@lib/logging";
import type { SheetKey } from "src/constants/sheetNames";
import { BaseSheet } from "../core";
import { BankAccounts } from "./BankAccounts";
import { MoneyOwedToUs } from "./MoneyOwedToUs";
import { Pensions } from "./Pensions";
import { Property } from "./Property";
import { Shares } from "./Shares";

export class Assets extends BaseSheet {
  static readonly sheetName: SheetKey = Meta.SHEET.NAME as SheetKey;
  constructor(spreadsheet: Spreadsheet) {
    super(Meta.SHEET.NAME, spreadsheet);
  }

  get bankAccountsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.BANK_ACCOUNTS_CELL);
  }

  get investmentsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.INVESTMENTS_CELL);
  }

  get newBankAccountsAssetValue(): number {
    const bankAccounts = new BankAccounts(this.spreadsheet);
    return bankAccounts.totalOurMoneyBalance;
  }

  get newInvestmentsAssetValue(): number {
    const shares = new Shares(this.spreadsheet);
    return shares.totalValue;
  }

  get newOwedToUsAssetValue(): number {
    const moneyOwedToUs = new MoneyOwedToUs(this.spreadsheet);
    return moneyOwedToUs.totalValue;
  }

  get newPensionsAssetValue(): number {
    const pensions = new Pensions(this.spreadsheet);
    return pensions.totalValue;
  }

  get newPropertyAssetValue(): number {
    const property = new Property(this.spreadsheet);
    return property.totalValue;
  }

  get owedToUsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.OWED_TO_US_CELL);
  }

  get pensionsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.PENSIONS_CELL);
  }

  get propertyAssetValue(): number {
    return this.getCellValue(Meta.CELLS.PROPERTY_CELL);
  }

  @WithLog("Assets:fixSheet")
  fixSheet(): void {
    this.update();
    super.fixSheet();
  }

  @WithLog()
  update(): void {
    this.updateBankAccountsValue(this.newBankAccountsAssetValue);
    this.updateInvestmentsValue(this.newInvestmentsAssetValue);
    this.updateOwedToUsValue(this.newOwedToUsAssetValue);
    this.updatePensionsValue(this.newPensionsAssetValue);
    this.updatePropertyValue(this.newPropertyAssetValue);
  }

  updateBankAccountsValue(newValue: number): void {
    if (newValue === this.bankAccountsAssetValue) return;
    this.setCellValue(Meta.CELLS.BANK_ACCOUNTS_CELL, newValue);
    const note =
      "Sum of 'Bank accounts' balances (£) where 'Our money' is true";
    this.setCellNote(Meta.CELLS.BANK_ACCOUNTS_CELL, note);
  }

  updateInvestmentsValue(newValue: number): void {
    if (newValue === this.investmentsAssetValue) return;
    this.setCellValue(Meta.CELLS.INVESTMENTS_CELL, newValue);
    const note = "Sum of 'Shares' values (£)";
    this.setCellNote(Meta.CELLS.INVESTMENTS_CELL, note);
  }

  updateOwedToUsValue(newValue: number): void {
    if (newValue === this.owedToUsAssetValue) return;
    this.setCellValue(Meta.CELLS.OWED_TO_US_CELL, newValue);
    const note = "Sum of 'Money owed to us' Owed to us (£) values";
    this.setCellNote(Meta.CELLS.OWED_TO_US_CELL, note);
  }

  updatePensionsValue(newValue: number): void {
    if (newValue === this.pensionsAssetValue) return;
    this.setCellValue(Meta.CELLS.PENSIONS_CELL, newValue);
    const note = "Sum of 'Pensions' Pension values (£)";
    this.setCellNote(Meta.CELLS.PENSIONS_CELL, note);
  }

  updatePropertyValue(newValue: number): void {
    if (newValue === this.propertyAssetValue) return;
    this.setCellValue(Meta.CELLS.PROPERTY_CELL, newValue);
    const note = "Sum of 'Property' Property values (£)";
    this.setCellNote(Meta.CELLS.PROPERTY_CELL, note);
  }
}
