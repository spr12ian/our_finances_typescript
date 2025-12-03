import { getErrorMessage } from "@lib/errors";
import { sendMeHtmlEmail } from "@lib/google";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export function sendMeHtmlEmailFlow(): void {
  // import step implementations here to register them
  registerStep(
    "sendMeHtmlEmailFlow",
    sendMeHtmlEmailStep1
  );
}

const sendMeHtmlEmailStep1: StepFn = ({ input, log }) => {
  const fn = sendMeHtmlEmailStep1.name;
  const startTime = log.start(fn);

  try {
    const { subject, htmlBody } = input as {
      subject: string;
      htmlBody: string;
    };
    sendMeHtmlEmail(subject, htmlBody);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
