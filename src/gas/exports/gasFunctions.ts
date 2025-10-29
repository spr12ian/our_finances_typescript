// @gas/exports/gasFunctions.ts

import { getActiveSheetName, goToSheet, logSheetNames } from "@gas";
import { exportFormulasToDrive } from "@gas/exports/exportFormulasToDrive";
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
} from "@lib/constants";
import { logTime } from "@lib/logging/logTime";
import * as timeConstants from "@lib/timeConstants";
import { functionStart, withLog } from "@logging";
import { ensureQueueDateFormats, queueSetup } from "@queue/queueSetup";
import { purgeQueuesOldData, queueWorker } from "@queue/queueWorker";
import { validateAccountKeys } from "@sheets/validateAccountKeys";
import type {
  FixSheetFlowInput,
  FormatSheetFlowInput,
  UpdateOpenBalancesFlowInput,
} from "@workflow";
import { setupWorkflowsOnce } from "@workflow";
import type { ExampleFlowInput } from "@workflow/flows/exampleFlow";
import { startWorkflow } from "@workflow/workflowEngine";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { OurFinances } from "../../OurFinances";
import { validateAllMenuFunctionNames } from "../../validateAllMenuFunctionNames";
import { withReentryGuard } from "../../withReentryGuard";
import { handleEdit } from "../triggers/handleEdit";
import { handleOpen } from "../triggers/handleOpen";
import { applyDescriptionReplacements } from "./applyDescriptionReplacements";
import { onChange } from "./onChange";
import { onOpen } from "./onOpen";
import { onSelectionChange } from "./onSelectionChange";

export function GAS_applyDescriptionReplacements() {
  withLog(GAS_applyDescriptionReplacements.name, applyDescriptionReplacements)();
}

export function GAS_balanceSheet() {
  goToSheet(MetaBalanceSheet.SHEET.NAME);
}

export function GAS_budget() {
  goToSheet(MetaBudget.SHEET.NAME);
}

export function GAS_budgetAdHocTransactions() {
  goToSheet(MetaBudgetAdHocTransactions.SHEET.NAME);
}

export function GAS_budgetAnnualTransactions() {
  goToSheet(MetaBudgetAnnualTransactions.SHEET.NAME);
}

export function GAS_budgetMonthlyTransactions() {
  goToSheet(MetaBudgetMonthlyTransactions.SHEET.NAME);
}

export function GAS_budgetPredictedSpend() {
  goToSheet(MetaBudgetPredictedSpend.SHEET.NAME);
}

export function GAS_budgetWeeklyTransactions() {
  goToSheet(MetaBudgetWeeklyTransactions.SHEET.NAME);
}

export function GAS_categories() {
  goToSheet("Categories");
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

export function GAS_showDailyAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showDaily();
}

export function GAS_ensureQueueDateFormats() {
  withLog(GAS_ensureQueueDateFormats.name, ensureQueueDateFormats)();
}

export function GAS_example() {
  const workFlowName = "exampleFlow";
  const firstStep = "exampleStep1";
  const input = {
    parameter1: "Example string",
    parameter2: 42,
    startedBy: "GAS_example",
  } satisfies ExampleFlowInput;

  startWF(workFlowName, firstStep, input);
}

export function GAS_exportFormulasToDrive() {
  exportFormulasToDrive();
}

export function GAS_fixSheet() {
  const workFlowName = "fixSheetFlow";
  const firstStep = "fixSheetStep1";
  const input = {
    sheetName: getActiveSheetName(),
    startedBy: "GAS_fixSheet",
  } satisfies FixSheetFlowInput;

  startWF(workFlowName, firstStep, input);
}

export function GAS_formatSheet() {
  const workFlowName = "formatSheetFlow";
  const firstStep = "formatSheetStep1";
  const input = {
    sheetName: getActiveSheetName(),
    startedBy: "GAS_formatSheet",
  } satisfies FormatSheetFlowInput;

  startWF(workFlowName, firstStep, input);
}

export function GAS_goToSheetCategories() {
  goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_goToSheetCategoryClash() {
  goToSheet(MetaCategoryClash.SHEET.NAME);
}

export function GAS_goToSheetHMRC_B() {
  goToSheet(MetaHMRC_B.SHEET.NAME);
}

export function GAS_goToSheetHMRC_S() {
  goToSheet(MetaHMRC_S.SHEET.NAME);
}

export function GAS_goToSheetHMRCTransactionsSummary() {
  goToSheet("HMRC Transactions Summary");
}

export function GAS_goToSheetLoanGlenburnie() {
  goToSheet("Loan Glenburnie");
}

export function GAS_goToSheetPeople() {
  goToSheet("People");
}

export function GAS_goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
}

export function GAS_goToSheetTransactionCategories() {
  goToSheet(MetaTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetUncategorisedByDate() {
  goToSheet(MetaUncategorisedByDate.SHEET.NAME);
}

export function GAS_goToSheetXfersMismatch() {
  goToSheet("Xfers mismatch");
}

export function GAS_goToSheetNotInTransactionCategories() {
  goToSheet(MetaNotInTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetTransactionsByDate() {
  goToSheet(MetaTransactionsByDate.SHEET.NAME);
}

export function GAS_helloWorld(): void {
  logTime("Hello world!");
}

export function GAS_logSheetNames(): void {
  logSheetNames();
}

export function GAS_showMonthlyAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showMonthly();
}

export function GAS_onChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
  const finish = functionStart(GAS_onChange.name);
  setupWorkflowsOnce();

  onChange(e);

  finish();
}

export function GAS_onEditTrigger(
  e: GoogleAppsScript.Events.SheetsOnEdit
): void {
  handleEdit(e);
}

export function GAS_onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  Logger.log("GAS_onOpen called");
  withLog(GAS_onOpen.name, onOpen)(e);
}

export function GAS_onOpenTrigger(
  e: GoogleAppsScript.Events.SheetsOnOpen
): void {
  withLog(GAS_onOpenTrigger.name, handleOpen)(e);
}

export function GAS_onSelectionChange(e: any): void {
  withLog(GAS_onSelectionChange.name, onSelectionChange)(e);
}

export function GAS_showOpenAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  const ourFinances = new OurFinances(spreadsheet);
  ourFinances.bankAccounts.showOpenAccounts();
}

export function GAS_purgeQueuesOldData(): void {
  purgeQueuesOldData();
}

export function GAS_queueSetup(): void {
  queueSetup();
}

export function GAS_queueWorker(): void {
  setupWorkflowsOnce();
  queueWorker();
}

export function GAS_saveContainerIdOnce() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty(
    "FINANCES_SPREADSHEET_ID",
    id
  );
}

export function GAS_sendDailyHtmlEmail() {
  withReentryGuard(
    "SEND_DAILY_EMAIL_RUNNING",
    timeConstants.THIRTY_SECONDS,
    () => {
      const spreadsheet = getFinancesSpreadsheet();
      new OurFinances(spreadsheet).sendDailyHtmlEmail();
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
  setupWorkflowsOnce();
  startWorkflow("trimSheetFlow", "trimSheetStep1", {
    sheetName: getActiveSheetName(),
    startedBy: "GAS_trimSheet",
  });
}

export function GAS_updateAllDependencies() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAllDependencies();
}

export function GAS_updateAccountSheetBalances() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAccountSheetBalances();
}

export function GAS_updateOpenBalances() {
  const workFlowName = "updateOpenBalancesFlow";
  const firstStep = "init";
  const input = {
    startedBy: "GAS_updateOpenBalances",
  } satisfies UpdateOpenBalancesFlowInput;

  startWF(workFlowName, firstStep, input);
}

export function GAS_updateSpreadsheetSummary() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateSpreadsheetSummary();
}

export function GAS_updateTransactions() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateTransactions();
}

export function GAS_validateAccountKeys() {
  validateAccountKeys();
}

export function GAS_validateAllMenuFunctionNames() {
  validateAllMenuFunctionNames();
}

// Local helper functions

function startWF(workFlowName: string, firstStep: string, input: unknown) {
  setupWorkflowsOnce();
  startWorkflow(workFlowName, firstStep, input);
}
