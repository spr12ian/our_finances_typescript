// @workflow/flows/accountSheetBalanceValuesFlow.ts

import { getErrorMessage } from "@lib/errors";
import { BankAccounts } from "@sheets/classes/BankAccounts";
import { updateBalanceValues } from "@sheets/updateBalanceValues";
import { normalizeFlowInput } from "@workflow/normalizeFlowInput";
import { registerStep } from "@workflow/workflowRegistry";
import type { AccountSheetBalanceValuesStepFn } from "@workflow/workflowTypes";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";

const FLOW_NAME = "accountSheetBalanceValuesFlow" as const;

export function accountSheetBalanceValuesFlow(): void {
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep01);
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep02);
}

const accountSheetBalanceValuesStep01: AccountSheetBalanceValuesStepFn = ({
  input,
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep01.name;
  const startTime = log.start(fn);
  try {
    const normalized = normalizeFlowInput(FLOW_NAME, input ?? {});

    log(`${fn}: normalized input:`, normalized);

    const { accountSheetName, startRow } = normalized;

    updateBalanceValues(accountSheetName, startRow);

    state.accountKey = accountSheetName.slice(1);

    return {
      kind: "next",
      nextStep: "accountSheetBalanceValuesStep02",
      state,
    };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const accountSheetBalanceValuesStep02: AccountSheetBalanceValuesStepFn = ({
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep02.name;
  const startTime = log.start(fn);
  try {
    bankAccountsBalanceValue(state.accountKey);

    const output = {
      done: true,
    };
    return { kind: "complete", output };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

function bankAccountsBalanceValue(accountKey: string): void {
  const ss = getFinancesSpreadsheet();
  const ba = new BankAccounts(ss);
  ba.updateKeyBalance(accountKey);
}
