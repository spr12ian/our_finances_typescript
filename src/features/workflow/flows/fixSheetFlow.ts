import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging/FastLog";
import { hasFixSheet } from "@sheets/core/sheetGuards";
import { getExtendedSheet } from "@sheets/getExtendedSheet";
import { registerStep } from "@workflow/workflowRegistry";
import type { FixSheetStepFn, FlowName } from "@workflow/workflowTypes";

const FLOW_NAME = "fixSheetFlow" as FlowName;

export function fixSheetFlow(): void {
  // import step implementations here to register them
  registerStep(FLOW_NAME, fixSheetStep01);
}

const fixSheetStep01: FixSheetStepFn = ({ input, log }) => {
  const fn = fixSheetStep01.name;
  const startTime = log.start(fn);
  try {
    const { sheetName } = input;

    fixSheet_(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

function fixSheet_(sheetName: string): boolean {
  const fn = fixSheet_.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    const sheet = getExtendedSheet(sheetName);

    if (!hasFixSheet(sheet)) {
      // Optional: low-noise info so you can see when nothing happened
      FastLog.info(fn, `No fixSheet() on ${sheetName}`);
      return false;
    }

    sheet.fixSheet();
    return true;
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, "failed", { sheetName, errorMessage });

    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
