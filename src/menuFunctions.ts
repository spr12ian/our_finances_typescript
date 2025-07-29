import { goToSheet } from "./functions";
import { SHEET as HMRC_B_SHEET } from "./MetaHMRC_B";
import { SHEET as HMRC_S_SHEET } from "./MetaHMRC_S";
import { OurFinances } from "./OurFinances";
import { Spreadsheet } from "./Spreadsheet";

export function goToSheet_AHALIF() {
  goToSheet("_AHALIF");
}

export function goToSheet_CVITRA() {
  goToSheet("_CVITRA");
}

export function goToSheet_SVI2TJ() {
  goToSheet("_SVI2TJ");
}

export function goToSheet_SVIGBL() {
  goToSheet("_SVIGBL");
}

export function goToSheet_SVIIRF() {
  goToSheet("_SVIIRF");
}

export function goToSheetHMRC_B() {
  goToSheet(HMRC_B_SHEET.NAME);
}

export function goToSheetHMRC_S() {
  goToSheet(HMRC_S_SHEET.NAME);
}

export function goToSheetHMRCTransactionsSummary() {
  goToSheet("HMRC Transactions Summary");
}

export function goToSheetLoanGlenburnie() {
  goToSheet("Loan Glenburnie");
}

export function goToSheetPeople() {
  goToSheet("People");
}

export function goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
}

export function monthlyUpdate() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showMonthly();
}
