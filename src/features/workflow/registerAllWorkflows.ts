// src/features/workflow/registerAllWorkflows.ts

import * as flow from "./flows";

let allFlowsRegistered = false;

export function registerAllWorkflows(): void {
  if (allFlowsRegistered) return;

  flow.accountSheetBalanceValuesFlow();
  flow.applyDescriptionReplacementsFlow();
  flow.fixSheetFlow();
  flow.formatSheetFlow();
  flow.sendMeHtmlEmailFlow();
  flow.templateFlow();
  flow.trimSheetFlow();
  flow.updateOpenBalancesFlow();
  flow.updateTransactionsFlow();

  allFlowsRegistered = true;
}
