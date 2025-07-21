/// <reference types="google-apps-script" />

import { BankAccounts } from "./BankAccounts";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { getToday } from "./DateUtils";
import { DescriptionReplacements } from "./DescriptionReplacements";
import { OurFinances } from "./OurFinances";
import { Spreadsheet } from "./Spreadsheet";
import { TransactionsCategories } from "./TransactionsCategories";
import { sendMeEmail } from "./functions";

// Function declarations

function dailySorts() {
  const sheetsToSort = [
    BankAccounts.SHEET.NAME,
    BudgetAnnualTransactions.SHEET.NAME,
    BudgetMonthlyTransactions.SHEET.NAME,
    BudgetWeeklyTransactions.SHEET.NAME,
    DescriptionReplacements.SHEET.NAME,
    TransactionsCategories.SHEET.NAME,
  ];
  const spreadsheet = Spreadsheet.getActive();
  sheetsToSort.forEach((sheetName) => {
    const sheet = spreadsheet.getSheet(sheetName);
    if (sheet) {
      sheet.sortByFirstColumnOmittingHeader();
    } else {
      throw new Error(`${sheetName} not found`);
    }
  });
}

// onDateChange is not a Google trigger; it must be created under Triggers (time based)!!!
export function onDateChange() {
  sendDailyEmail();
  dailySorts();
}

function sendDailyEmail() {
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
