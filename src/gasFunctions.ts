import {
  MetaBalanceSheet,
  MetaBudget,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaBudgetMonthlyTransactions,
  MetaBudgetPredictedSpend,
  MetaBudgetWeeklyTransactions,
  MetaCategories,
  MetaCategoryClash,
  MetaHMRC_B,
  MetaHMRC_S,
  MetaNotInTransactionCategories,
  MetaTransactionCategories,
  MetaTransactionsByDate,
  MetaUncategorisedByDate,
} from "./constants";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { handleEditTrigger } from "./handleEditTrigger";
import { handleOpenTrigger } from "./handleOpenTrigger";
import { logTime } from "./logTime";
import { OurFinances } from "./OurFinances";
import { queue_ensureSetup } from "./queueSetup";
import { queue_worker } from "./queueWorker";
import { FastLog } from "./support/FastLog";
import * as timeConstants from "./timeConstants";
import { FIX_SHEET } from "./FIX_SHEET";
import { UPDATE_ACCOUNT_BALANCES } from "./UPDATE_ACCOUNT_BALANCES";
import { UPDATE_BALANCES } from "./UPDATE_BALANCES";
import { validateAllMenuFunctionNames } from "./validateAllMenuFunctionNames";
import { withReentryGuard } from "./withReentryGuard";

export function GAS_applyDescriptionReplacements() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).applyDescriptionReplacements();
}

export function GAS_balanceSheet() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaBalanceSheet.SHEET.NAME);
}

export function GAS_budget() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaBudget.SHEET.NAME);
}

export function GAS_budgetAdHocTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(
    MetaBudgetAdHocTransactions.SHEET.NAME
  );
}

export function GAS_budgetAnnualTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(
    MetaBudgetAnnualTransactions.SHEET.NAME
  );
}

export function GAS_budgetMonthlyTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(
    MetaBudgetMonthlyTransactions.SHEET.NAME
  );
}

export function GAS_budgetPredictedSpend() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaBudgetPredictedSpend.SHEET.NAME);
}

export function GAS_budgetWeeklyTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(
    MetaBudgetWeeklyTransactions.SHEET.NAME
  );
}

export function GAS_categories() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("Categories");
}

export function GAS_convertCurrentColumnToUppercase() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).convertCurrentColumnToUppercase();
}

export function GAS_dailySorts() {
  const spreadsheet = getFinancesSpreadsheet();

  withReentryGuard("DAILY_SORTS_RUNNING", timeConstants.FIVE_MINUTES, () => {
    new OurFinances(spreadsheet).dailySorts();
  });
}

export function GAS_dailyUpdate() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showDaily();
}

export function GAS_exportFormulasToDrive() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).exportFormulasToDrive();
}

export function GAS_fixSheet() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).fixSheet();
}

export function GAS_formatAccountSheet() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).formatAccountSheet();
}

export function GAS_goToSheet_AHALIF() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("_AHALIF");
}

export function GAS_goToSheetCategories() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_goToSheetCategoryClash() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaCategoryClash.SHEET.NAME);
}

export function GAS_goToSheet_CVITRA() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("_CVITRA");
}

export function GAS_goToSheet_SVI2TJ() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("_SVI2TJ");
}

export function GAS_goToSheet_SVIGBL() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("_SVIGBL");
}

export function GAS_goToSheet_SVIIRF() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("_SVIIRF");
}

export function GAS_goToSheetHMRC_B() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaHMRC_B.SHEET.NAME);
}

export function GAS_goToSheetHMRC_S() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaHMRC_S.SHEET.NAME);
}

export function GAS_goToSheetHMRCTransactionsSummary() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("HMRC Transactions Summary");
}

export function GAS_goToSheetLoanGlenburnie() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("Loan Glenburnie");
}

export function GAS_goToSheetPeople() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("People");
}

export function GAS_goToSheetSW183PTInventory() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("SW18 3PT inventory");
}

export function GAS_goToSheetTransactionCategories() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetUncategorisedByDate() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaUncategorisedByDate.SHEET.NAME);
}

export function GAS_goToSheetXfersMismatch() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet("Xfers mismatch");
}

export function GAS_goToSheetNotInTransactionCategories() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(
    MetaNotInTransactionCategories.SHEET.NAME
  );
}

export function GAS_goToSheetTransactionsByDate() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).goToSheet(MetaTransactionsByDate.SHEET.NAME);
}

export function GAS_helloWorld(): void {
  logTime("Hello world!");
}

export function GAS_monthlyUpdate() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showMonthly();
}

export function GAS_onChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
  withReentryGuard("ONCHANGE_RUNNING", timeConstants.ONE_MINUTE, () => {
    const spreadsheet = getFinancesSpreadsheet(e);
    new OurFinances(spreadsheet).onChange(e);
  });
}

export function GAS_onEditTrigger(
  e: GoogleAppsScript.Events.SheetsOnEdit
): void {
  handleEditTrigger(e);
}

export function GAS_onOpenTrigger(
  e: GoogleAppsScript.Events.SheetsOnOpen
): void {
  handleOpenTrigger(e);
}

export function GAS_onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  FastLog.log("Started GAS_onOpen");
  if (e) {
    FastLog.log(`Event details: ${JSON.stringify(e, null, 2)}`);
  }
  const spreadsheet = getFinancesSpreadsheet(e);
  new OurFinances(spreadsheet).onOpen();
  FastLog.log("Finished GAS_onOpen");
}

export function GAS_openAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  const ourFinances = new OurFinances(spreadsheet);
  ourFinances.bankAccounts.showOpenAccounts();
}

export function GAS_queueSetup(): void {
  queue_ensureSetup();
}

export function GAS_queueWorker(): void {
  queue_worker();
}

export function GAS_saveContainerIdOnce() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty(
    "FINANCES_SPREADSHEET_ID",
    id
  );
}

export function GAS_sendDailyEmail() {
  withReentryGuard(
    "SEND_DAILY_EMAIL_RUNNING",
    timeConstants.FIVE_MINUTES,
    () => {
      const spreadsheet = getFinancesSpreadsheet();
      new OurFinances(spreadsheet).sendDailyEmail();
    }
  );
}

export function GAS_showAllAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).showAllAccounts();
}

export function GAS_sortSheets() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).sortSheets();
}

export function GAS_trimAllSheets() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).trimAllSheets();
}

export function GAS_trimSheet() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).trimSheet();
}

export function GAS_updateAllDependencies() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAllDependencies();
}

export function GAS_updateBalanceValues() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateBalanceValues();
}

export function GAS_updateSpreadsheetSummary() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateSpreadsheetSummary();
}

export function GAS_updateTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateTransactions();
}

export function GAS_updateTransactionCategories() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateTransactionCategories();
}

export function GAS_validateAllMenuFunctionNames() {
  validateAllMenuFunctionNames();
}

export function GAS_FIX_SHEET(parameters: any) {
  FIX_SHEET(parameters);
}

export function GAS_UPDATE_ACCOUNT_BALANCES(parameters: any) {
  UPDATE_ACCOUNT_BALANCES(parameters);
}

export function GAS_UPDATE_BALANCES(parameters: any) {
  UPDATE_BALANCES(parameters);
}
