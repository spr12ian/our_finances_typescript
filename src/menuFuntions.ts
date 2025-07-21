import { goToSheet } from "./functions";

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

export function goToSheetCategories() {
  goToSheet("Categories");
}

export function goToSheetCategoryClash() {
  goToSheet("Category clash");
}

export function goToSheetHMRC_B() {
  goToSheet(HMRC_B.SHEET_NAME);
}

export function goToSheetHMRC_S() {
  goToSheet(HMRC_S.SHEET.NAME);
}

export function goToSheetHMRCTransactionsSummary() {
  goToSheet("HMRC Transactions Summary");
}

export function goToSheetLoanGlenburnie() {
  goToSheet("Loan Glenburnie");
}

export function goToSheetNotInTransactionCategories() {
  goToSheet("Not in transaction categories");
}

export function goToSheetPeople() {
  goToSheet("People");
}

export function goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
}

export function goToSheetTransactionsBuilder() {
  goToSheet("Transactions builder");
}

export function goToSheetTransactionsByDate() {
  goToSheet("Transactions by date");
}

export function goToSheetTransactionsCategories() {
  goToSheet("Transactions categories");
}

export function goToSheetUnlabelledByDate() {
  goToSheet("Uncategorised by date");
}

export function goToSheetXfersMismatch() {
  goToSheet("Xfers mismatch");
}

export function monthlyUpdate() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showMonthly();
}
