// @workflow/flows/applyDescriptionReplacementsFlow.ts
import { getErrorMessage } from "@lib/errors";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export type ApplyDescriptionReplacementsFlowInput = {
  accountSheetName: string;
};

export function applyDescriptionReplacementsFlow(): void {
  registerStep(
    "applyDescriptionReplacementsFlow",
    applyDescriptionReplacementsStep1
  );
}

const applyDescriptionReplacementsStep1: StepFn = ({ input, state, log }) => {
  const fn = applyDescriptionReplacementsStep1.name;
  const startTime = log.start(fn);
  try {
    const { accountSheetName } = input as ApplyDescriptionReplacementsFlowInput;

    applyDescriptionReplacements(accountSheetName);

    return { kind: "complete", output: state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

function applyDescriptionReplacements(accountSheetName: string): void {
  const spreadsheet = getFinancesSpreadsheet();
  const sheet = spreadsheet.getSheet(accountSheetName);
  const accountSheet = new AccountSheet(sheet, spreadsheet);
  accountSheet.applyDescriptionReplacements();
}
