// src/workflow/flows/updateOpenBalancesFlow.ts
import { getErrorMessage } from "@lib/errors";
import { BankAccounts } from "@sheets/classes/BankAccounts";
import { getFinancesSpreadsheet } from "../../../getFinancesSpreadsheet";
import { registerStep } from "../workflowRegistry";
import type { UpdateOpenBalancesStepFn, FlowName } from "../workflowTypes";

const FLOW_NAME = "updateOpenBalancesFlow" as FlowName;

type State = {
  keys: string[];
  idx: number; // 0-based index of next key to process
};

export function updateOpenBalancesFlow() {
  registerStep(FLOW_NAME, updateOpenBalancesStep01);
  registerStep(FLOW_NAME, processOneStep);
}

/** Step 1: capture a stable list of open keys and move to the worker step. */
const updateOpenBalancesStep01: UpdateOpenBalancesStepFn = ({ log }) => {
  const fn = "init";
  const start = log.start(fn);

  try {
    const ss = getFinancesSpreadsheet();
    const ba = new BankAccounts(ss);

    const keys = ba.getOpenKeys(); // pure read, no queue calls here
    log(`Found ${keys.length} open accounts`);

    if (keys.length === 0) {
      log("No open accounts to update — finishing.");
      return { kind: "complete" };
    }

    const state: State = { keys, idx: 0 };
    return { kind: "next", nextStep: "processOne", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, start);
  }
};

/** Step 2: process exactly ONE key per invocation, then loop until done. */
const processOneStep: UpdateOpenBalancesStepFn = ({ state, log, startedAt, budgetMs }) => {
  const fn = "processOne";
  const start = log.start(fn);

  try {
    const { keys, idx } = state ?? { keys: [], idx: 0 };
    if (!keys || idx >= keys.length) {
      log("All keys processed.");
      return { kind: "complete" };
    }

    const key = keys[idx];
    log(`Updating balance for [${idx + 1}/${keys.length}] '${key}'`);

    // One key only per run → avoids timeouts and respects queue semantics
    const ss = getFinancesSpreadsheet();
    const ba = new BankAccounts(ss);
    ba.updateKeyBalance(key);

    const nextIdx = idx + 1;
    const done = nextIdx >= keys.length;

    // (Optional) respect the engine budget if you ever extend to >1 per step:
    const elapsed = Date.now() - startedAt;
    const nearBudget = elapsed > Math.floor(0.8 * budgetMs);

    if (!done && nearBudget) {
      // We already do only one key; this is defensive if you later batch more work.
      log("Near budget; yielding before scheduling next key.");
      return { kind: "yield", state: { keys, idx: nextIdx }, delayMs: 0 };
    }

    if (done) {
      log("Finished all open account balances.");
      return { kind: "complete" };
    }

    // Loop the same step with the next index
    return {
      kind: "next",
      nextStep: "processOne",
      state: { keys, idx: nextIdx },
    };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, start);
  }
};

// type StepFn<I = unknown, S = Record<string, unknown>> = (args: {
//   queueId: string;
//   workflowName: string;
//   stepName: string;
//   input: I;
//   state: S;
//   attempt: number;
//   budgetMs: number;
//   startedAt: number;
//   log: {
//     (msg: string, ...rest: unknown[]): void;
//     error: (err: unknown, ...rest: unknown[]) => void;
//     start: (fn?: string, ...rest: unknown[]) => number;
//     finish: (fn: string | undefined, startTime: number) => void;
//   };
//   now: () => number;
// }) =>
//   | { kind: "complete" }
//   | { kind: "next"; nextStep: string; state?: S }
//   | { kind: "yield"; state: S; delayMs?: number }
//   | { kind: "fail"; reason: unknown; retryable?: boolean };
