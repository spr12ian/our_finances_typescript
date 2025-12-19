// @workflow/flows/applyDescriptionReplacementsFlow.ts
import { getErrorMessage } from "@lib/errors";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import type { ApplyDescriptionReplacementsStepFn, FlowName } from "@workflow/workflowTypes";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { registerStep } from "../workflowRegistry";

const FLOW_NAME = "applyDescriptionReplacementsFlow" as FlowName;

export function applyDescriptionReplacementsFlow(): void {
  registerStep(FLOW_NAME, "applyDescriptionReplacementsStep01", applyDescriptionReplacementsStep01);
}

const applyDescriptionReplacementsStep01: ApplyDescriptionReplacementsStepFn =
  ({ input, state, log }) => {
    const fn = applyDescriptionReplacementsStep01.name;
    const startTime = log.start(fn);
    try {
      const { accountSheetName } = input;

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
