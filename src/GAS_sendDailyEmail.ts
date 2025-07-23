/// <reference types="google-apps-script" />

import { getToday } from "./DateUtils";
import { OurFinances } from "./OurFinances";
import { sendMeEmail } from "./functions";

export function GAS_sendDailyEmail() {
  const ourFinances = new OurFinances();
  const fixedAmountMismatches = ourFinances.fixedAmountMismatches;
  const upcomingDebits = ourFinances.upcomingDebits;

  const subject = `Our finances daily email: ${getToday()}`;

  // Initialize the email body
  let emailBody = ``;

  if (fixedAmountMismatches.length > 0) {
    emailBody += `Fixed amount mismatches\n`;
    // Concatenate the fixedAmountMismatches into the email body
    emailBody += fixedAmountMismatches.join("\n");
    emailBody += `\n\n`;
  }

  if (upcomingDebits.length) {
    emailBody += `Upcoming debits\n`;
    // Concatenate the debits into the email body
    emailBody += upcomingDebits.join("\n");
    emailBody += `\n\n`;
  }

  // Append the spreadsheet URL
  emailBody += `\n\nSent from (sendDailyEmail): ${ourFinances.url}\n`;

  // Send the email
  sendMeEmail(subject, emailBody);
}
