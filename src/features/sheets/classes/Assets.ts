import type { Spreadsheet } from "@domain";
import { MetaAssets as Meta } from "@lib/constants";
import { BaseSheet } from "../core";
import { BankAccounts } from "./BankAccounts";

export class Assets extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    super(Meta.SHEET.NAME, spreadsheet);
  }

  get bankAccountsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.BANK_ACCOUNTS_VALUE);
  }

  get investmentsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.INVESTMENTS_VALUE);
  }

  get newBankAccountsAssetValue(): number {
    const bankAccounts = new BankAccounts(this.spreadsheet);
    return bankAccounts.totalOurMoneyBalance;
  }

  get owedToUsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.OWED_TO_US_VALUE);
  }

  get pensionsAssetValue(): number {
    return this.getCellValue(Meta.CELLS.PENSIONS_VALUE);
  }

  get propertyAssetValue(): number {
    return this.getCellValue(Meta.CELLS.PROPERTY_VALUE);
  }

  fixSheet(): void {
    this.update();
    super.fixSheet();
  }

  update(): void {
    this.updateBankAccountsValue(this.newBankAccountsAssetValue);
    // this.updateInvestmentsValue(this.newInvestmentsAssetValue);
    // this.updateOwedToUsValue(this.newOwedToUsAssetValue);
    // this.updatePensionsValue(this.newPensionsAssetValue);
    // this.updatePropertyValue(this.newPropertyAssetValue);
  }

  updateBankAccountsValue(newValue: number): void {
    if (newValue === this.bankAccountsAssetValue) return;
    this.setCellValue(Meta.CELLS.BANK_ACCOUNTS_VALUE, newValue);
  }

  updateInvestmentsValue(newValue: number): void {
    if (newValue === this.investmentsAssetValue) return;
    this.setCellValue(Meta.CELLS.INVESTMENTS_VALUE, newValue);
  }

  updateOwedToUsValue(newValue: number): void {
    if (newValue === this.owedToUsAssetValue) return;
    this.setCellValue(Meta.CELLS.OWED_TO_US_VALUE, newValue);
  }

  updatePensionsValue(newValue: number): void {
    if (newValue === this.pensionsAssetValue) return;
    this.setCellValue(Meta.CELLS.PENSIONS_VALUE, newValue);
  }

  updatePropertyValue(newValue: number): void {
    if (newValue === this.propertyAssetValue) return;
    this.setCellValue(Meta.CELLS.PROPERTY_VALUE, newValue);
  }
}
