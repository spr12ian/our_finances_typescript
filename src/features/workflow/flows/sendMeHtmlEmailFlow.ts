import { getErrorMessage } from "@lib/errors";
import { sendMeHtmlEmail } from "@lib/google";
import { registerStep } from "../workflowRegistry";
import type { SendMeHtmlEmailStepFn, FlowName } from "../workflowTypes";

const FLOW_NAME = "sendMeHtmlEmailFlow" as FlowName;

export function sendMeHtmlEmailFlow(): void {
  // import step implementations here to register them
  registerStep(
    FLOW_NAME,
    sendMeHtmlEmailStep01
  );
}

const sendMeHtmlEmailStep01: SendMeHtmlEmailStepFn = ({ input, log }) => {
  const fn = sendMeHtmlEmailStep01.name;
  const startTime = log.start(fn);

  try {
    const { subject, htmlBody } = input;
    sendMeHtmlEmail(subject, htmlBody);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
