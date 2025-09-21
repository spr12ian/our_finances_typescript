import { getErrorMessage } from "@lib/errors";
import { sendMeEmail } from "@lib/google";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export function sendMeEmailFlow(): void {
  // import step implementations here to register them
  registerStep("sendMeEmailFlow", "sendMeEmailStep1", sendMeEmailStep1);
}

const sendMeEmailStep1: StepFn = ({ input, log }) => {
  const fn = sendMeEmailStep1.name;
  const startTime = log.start(fn);

  try {
    const { subject, body } = input as {
      subject: string;
      body: string;
    };
    sendMeEmail(subject, body);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
