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
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withLog } from "@logging";
import { ensureQueueDateFormats, queueSetup } from "@queue/queueSetup";
import { purgeQueuesOldData, queueWorker } from "@queue/queueWorker";
import { storeAccountSheetNames } from "@sheets/accountSheetFunctions";
import { validateAccountKeys } from "@sheets/validateAccountKeys";
import type {
  FixSheetFlowInput,
  FormatSheetFlowInput,
  TrimSheetFlowInput,
  UpdateOpenBalancesFlowInput,
} from "@workflow";
import { setupWorkflowsOnce } from "@workflow";
import type { ExampleFlowInput } from "@workflow/flows/exampleFlow";
import { startWorkflow } from "@workflow/workflowEngine";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { ONE_MINUTE_MS } from "../../lib/timeConstants";
import { withReentryGuard } from "../../lib/withReentryGuard";
import { OurFinances } from "../../OurFinances";
import { validateAllMenuFunctionNames } from "../../validateAllMenuFunctionNames";
import { handleChange } from "../triggers/handleChange";
import { handleEdit } from "../triggers/handleEdit";
import { handleOpen } from "../triggers/handleOpen";
import { applyDescriptionReplacements } from "./applyDescriptionReplacements";
import { onEdit } from "./onEdit";
import { onOpen } from "./onOpen";
import { onSelectionChange } from "./onSelectionChange";

export function GAS_applyDescriptionReplacements() {
  withLog(
    GAS_applyDescriptionReplacements.name,
    applyDescriptionReplacements
  )();
}

export function GAS_categories() {
  goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_convertCurrentColumnToUppercase() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).convertCurrentColumnToUppercase();
}

export function GAS_dailySorts() {
  const spreadsheet = getFinancesSpreadsheet();

  withReentryGuard("DAILY_SORTS_RUNNING", 5 * ONE_MINUTE_MS, () => {
    new OurFinances(spreadsheet).dailySorts();
  });
}

export function GAS_ensureQueueDateFormats() {
  withLog(GAS_ensureQueueDateFormats.name, ensureQueueDateFormats)();
}

export function GAS_example() {
  const startedBy = GAS_example.name;
  const workFlowName = "exampleFlow";
  const firstStep = "exampleStep1";
  const input = {
    parameter1: "Example string",
    parameter2: 42,
    startedBy,
  } satisfies ExampleFlowInput;

  withLog(startedBy, startWF)(workFlowName, firstStep, input);
}

export function GAS_exportFormulasToDrive() {
  exportFormulasToDrive();
}

export function GAS_fixSheet() {
  const startedBy = GAS_fixSheet.name;
  const workFlowName = "fixSheetFlow";
  const firstStep = "fixSheetStep1";
  const input = {
    sheetName: getActiveSheetName(),
    startedBy,
  } satisfies FixSheetFlowInput;

  withLog(startedBy, startWF)(workFlowName, firstStep, input);
}

export function GAS_formatSheet() {
  const startedBy = GAS_formatSheet.name;
  const workFlowName = "formatSheetFlow";
  const firstStep = "formatSheetStep1";
  const input = {
    sheetName: getActiveSheetName(),
    startedBy,
  } satisfies FormatSheetFlowInput;

  withLog(startedBy, startWF)(workFlowName, firstStep, input);
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

export function GAS_onChangeTrigger(
  e: GoogleAppsScript.Events.SheetsOnChange
): void {
  withLog(GAS_onChangeTrigger.name, handleChange)(e);
}

export function GAS_onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  withLog(GAS_onEdit.name, onEdit)(e);
}

export function GAS_onEditTrigger(
  e: GoogleAppsScript.Events.SheetsOnEdit
): void {
  withLog(GAS_onEditTrigger.name, handleEdit)(e);
}

export function GAS_onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
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

export function GAS_purgeQueuesOldData(): void {
  purgeQueuesOldData();
}

export function GAS_queueSetup(): void {
  queueSetup();
}

export function GAS_queueWorker(): void {
  withLog(GAS_queueWorker.name, queueWorker)();
}

export function GAS_saveContainerIdOnce() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty(
    "FINANCES_SPREADSHEET_ID",
    id
  );
}

export function GAS_sendDailyHtmlEmail() {
  withReentryGuard("SEND_DAILY_EMAIL_RUNNING", 30 * ONE_SECOND_MS, () => {
    const spreadsheet = getFinancesSpreadsheet();
    new OurFinances(spreadsheet).sendDailyHtmlEmail();
  });
}

export function GAS_showAllAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).showAllAccounts();
}

export function GAS_showDailyAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showDaily();
}

export function GAS_showMonthlyAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).bankAccounts.showMonthly();
}

export function GAS_showOpenAccounts() {
  const spreadsheet = getFinancesSpreadsheet();
  const ourFinances = new OurFinances(spreadsheet);
  ourFinances.bankAccounts.showOpenAccounts();
}

export function GAS_sortSheets() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).sortSheets();
}

export function GAS_storeAccountSheetNames() {
  withLog(GAS_storeAccountSheetNames.name, storeAccountSheetNames)();
}

export function GAS_toBalanceSheet() {
  withLog(GAS_toBalanceSheet.name, goToSheet)(MetaBalanceSheet.SHEET.NAME);
}

export function GAS_toBudget() {
  goToSheet(MetaBudget.SHEET.NAME);
}

export function GAS_toBudgetAdHocTransactions() {
  goToSheet(MetaBudgetAdHocTransactions.SHEET.NAME);
}

export function GAS_toBudgetAnnualTransactions() {
  goToSheet(MetaBudgetAnnualTransactions.SHEET.NAME);
}

export function GAS_toBudgetMonthlyTransactions() {
  goToSheet(MetaBudgetMonthlyTransactions.SHEET.NAME);
}

export function GAS_toBudgetPredictedSpend() {
  goToSheet(MetaBudgetPredictedSpend.SHEET.NAME);
}

export function GAS_toBudgetWeeklyTransactions() {
  goToSheet(MetaBudgetWeeklyTransactions.SHEET.NAME);
}

export function GAS_trimAllSheets() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).trimAllSheets();
}

export function GAS_trimSheet() {
  const startedBy = GAS_trimSheet.name;
  const workFlowName = "trimSheetFlow";
  const firstStep = "trimSheetStep1";
  const input = {
    sheetName: getActiveSheetName(),
    startedBy,
  } satisfies TrimSheetFlowInput;

  withLog(startedBy, startWF)(workFlowName, firstStep, input);
}

export function GAS_updateAccountSheetBalances() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAccountSheetBalances();
}

export function GAS_updateAllDependencies() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAllDependencies();
}

export function GAS_updateOpenBalances() {
  const startedBy = GAS_updateOpenBalances.name;
  const workFlowName = "updateOpenBalancesFlow";
  const firstStep = "init";
  const input = {
    startedBy,
  } satisfies UpdateOpenBalancesFlowInput;

  withLog(startedBy, startWF)(workFlowName, firstStep, input);
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
