// @gas/exports/gasFunctions.ts

import { getActiveSheetName, goToSheet, logSheetNames } from "@gas";
import { convertCurrentColumnToUppercase } from "@gas/convertCurrentColumnToUppercase";
import { exportFormulasToDrive } from "@gas/exports/exportFormulasToDrive";
import { dailySorts } from "@gas/triggers/dailySorts";
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
  MetaHMRC_TaxReturn,
  MetaNotInTransactionCategories,
  MetaTransactionCategories,
  MetaTransactionsByDate,
  MetaUncategorisedByDate,
} from "@lib/constants";
import { logTime } from "@lib/logging/logTime";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog, withLog } from "@logging";
import { queuePurgeOldData } from "@queue/queuePurgeOldData";
import { ensureQueueDateFormats, queueSetup } from "@queue/queueSetup";
import { queueWorker } from "@queue/queueWorker";
import { storeAccountSheetNames } from "@sheets/accountSheetFunctions";
import { validateAccountKeys } from "@sheets/validateAccountKeys";
import { setupWorkflowsOnce } from "@workflow";
import { FLOW_INPUT_DEFAULTS_REGISTRY } from "@workflow/flowInputConstants";
import type { TemplateFlowInput } from "@workflow/workflowTypes";
import { queueWorkflow } from "@workflow/queueWorkflow";
import type {
  AccountSheetBalanceValuesFlowInput,
  ApplyDescriptionReplacementsFlowInput,
  FixSheetFlowInput,
  FlowInput,
  FlowName,
  FormatSheetFlowInput,
  TrimSheetFlowInput,
  UpdateOpenBalancesFlowInput,
} from "@workflow/workflowTypes";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { ONE_MINUTE_MS } from "../../lib/timeConstants";
import { withReentryGuard } from "../../lib/withReentryGuard";
import { OurFinances } from "../../OurFinances";
import { validateAllMenuFunctionNames } from "../../validateAllMenuFunctionNames";
import { dailySendHtmlEmail } from "../triggers/dailySendHtmlEmail";
import { handleChange } from "../triggers/handleChange";
import { handleEdit } from "../triggers/handleEdit";
import { handleOpen } from "../triggers/handleOpen";
import { onEdit } from "./onEdit";
import { onOpen } from "./onOpen";
import { onSelectionChange } from "./onSelectionChange";

const DISABLED_FUNCTIONS = new Set<Function>([
  // GAS_applyDescriptionReplacements,
  // GAS_dailySendHtmlEmail,
  // GAS_dailySorts,
  GAS_onChangeTrigger,
  GAS_onEdit,
  GAS_onEditTrigger,
  // GAS_onOpen,
  // GAS_onOpenTrigger,
  GAS_onSelectionChange,
  // GAS_queuePurgeOldData,
  // GAS_queueWorker,
]);

export function GAS_accountSheetBalanceValues() {
  const input = {
    ...FLOW_INPUT_DEFAULTS_REGISTRY.accountSheetBalanceValuesFlow,
    accountSheetName: getActiveSheetName(), // override the default empty string
  } satisfies AccountSheetBalanceValuesFlowInput;

  withLog(queueWF_)(GAS_accountSheetBalanceValues, input);
}

export function GAS_applyDescriptionReplacements() {
  if (isDisabled_(GAS_applyDescriptionReplacements)) return;

  const input = {
    accountSheetName: getActiveSheetName(),
  } satisfies ApplyDescriptionReplacementsFlowInput;

  withLog(queueWF_)(GAS_applyDescriptionReplacements, input);
}

export function GAS_categories() {
  goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_convertCurrentColumnToUppercase() {
  convertCurrentColumnToUppercase();
}

export function GAS_dailySendHtmlEmail() {
  if (isDisabled_(GAS_dailySendHtmlEmail)) return;

  withReentryGuard("SEND_DAILY_EMAIL_RUNNING", 30 * ONE_SECOND_MS, () => {
    withLog(dailySendHtmlEmail)();
  });
}

export function GAS_dailySorts() {
  if (isDisabled_(GAS_dailySorts)) return;

  withReentryGuard("DAILY_SORTS_RUNNING", 5 * ONE_MINUTE_MS, () => {
    withLog(dailySorts)();
  });
}

export function GAS_ensureQueueDateFormats() {
  withLog(ensureQueueDateFormats)();
}

export function GAS_exportFormulasToDrive() {
  exportFormulasToDrive();
}

export function GAS_fixSheet() {
  const input = {
    sheetName: getActiveSheetName(),
  } satisfies FixSheetFlowInput;

  withLog(queueWF_)(GAS_fixSheet, input);
}

export function GAS_formatSheet() {
  const input = {
    sheetName: getActiveSheetName(),
  } satisfies FormatSheetFlowInput;

  withLog(queueWF_)(GAS_formatSheet, input);
}

export function GAS_goToSheetCategories() {
  goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_goToSheetCategoryClash() {
  goToSheet(MetaCategoryClash.SHEET.NAME);
}

export function GAS_goToSheetHMRC_TaxReturn() {
  goToSheet(MetaHMRC_TaxReturn.SHEET.NAME);
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
  if (isDisabled_(GAS_onChangeTrigger)) return;

  withLog(handleChange)(e);
}

export function GAS_onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  if (isDisabled_(GAS_onEdit)) return;

  withLog(onEdit)(e);
}

export function GAS_onEditTrigger(
  e: GoogleAppsScript.Events.SheetsOnEdit
): void {
  if (isDisabled_(GAS_onEditTrigger)) return;

  withLog(handleEdit)(e);
}

export function GAS_onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  if (isDisabled_(GAS_onOpen)) return;

  withLog(onOpen)(e);
}

export function GAS_onOpenTrigger(
  e: GoogleAppsScript.Events.SheetsOnOpen
): void {
  if (isDisabled_(GAS_onOpenTrigger)) return;

  withLog(handleOpen)(e);
}

export function GAS_onSelectionChange(e: any): void {
  if (isDisabled_(GAS_onSelectionChange)) return;

  withLog(onSelectionChange)(e);
}

export function GAS_queuePurgeOldData(): void {
  if (isDisabled_(GAS_queuePurgeOldData)) return;

  withLog(queuePurgeOldData)();
}

export function GAS_queueSetup(): void {
  queueSetup();
}

export function GAS_queueWorker(): void {
  if (isDisabled_(GAS_queueWorker)) return;

  withLog(queueWorker)();
}

export function GAS_saveContainerIdOnce() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty(
    "FINANCES_SPREADSHEET_ID",
    id
  );
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
  withLog(storeAccountSheetNames)();
}

export function GAS_template() {
  const input = {
    parameter1: "Example string",
    parameter2: 42,
  } satisfies Partial<TemplateFlowInput>;

  withLog(queueWF_)(GAS_template, input);
}

export function GAS_toBalanceSheet() {
  withLog(goToSheet)(MetaBalanceSheet.SHEET.NAME);
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
  const input = {
    sheetName: getActiveSheetName(),
  } satisfies TrimSheetFlowInput;

  withLog(queueWF_)(GAS_trimSheet, input);
}

export function GAS_updateAllDependencies() {
  const spreadsheet = getFinancesSpreadsheet();
  new OurFinances(spreadsheet).updateAllDependencies();
}

export function GAS_updateOpenBalances() {
  const input = {} satisfies UpdateOpenBalancesFlowInput;

  withLog(queueWF_)(GAS_updateOpenBalances, input);
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

function deriveFirstStepName_(queuedBy: string): string {
  return (queuedBy + "Step01");
}

function deriveWorkflowName_(queuedBy: string): FlowName {
  return (queuedBy + "Flow") as FlowName;
}

function isDisabled_(fn: Function): boolean {
  const isDisabled = DISABLED_FUNCTIONS.has(fn);
  if (isDisabled) {
    FastLog.info(`${fn.name} is disabled`);
  }
  return isDisabled;
}

function queueWF_(workflow: Function, input: Partial<FlowInput<FlowName>>) {
  const fn = queueWF_.name;
  const initialName = workflow.name;

  if (!initialName.startsWith("GAS_")) {
    throw new Error(
      `${fn}: workflowName must start with "GAS_", got "${initialName}"`
    );
  }

  const queuedBy = initialName.slice(4);
  const workflowName = deriveWorkflowName_(queuedBy);
  const firstStep = deriveFirstStepName_(queuedBy);

  FastLog.log(fn, { workflowName, firstStep, input, queuedBy });

  withLog(setupWorkflowsOnce)();
  withLog(queueWorkflow)(workflowName, firstStep, input, { queuedBy });
}
