// dailySendHtmlEmail.ts

import type { Spreadsheet } from "@domain";
import { formatLondonDate } from "@lib/dates";
import { sendMeHtmlEmail } from "@lib/google/email";
import {
  htmlHorizontalRule,
  toHtmlH1,
  toHtmlH2,
  toHtmlH3,
  toHtmlParagraph,
} from "@lib/html/htmlFunctions";
import { renderBankDebitsDueSummaryHtml } from "@lib/html/renderBankDebitsDueSummaryHtml";
import { renderUpcomingDebitsAsHtmlTable } from "@lib/html/renderUpcomingDebitsAsHtmlTable";
import type { UpcomingDebit } from "@sheets/budgetTypes";
import { BankDebitsDue } from "@sheets/classes/BankDebitsDue";
import { BudgetAdHocTransactions } from "@sheets/classes/BudgetAdHocTransactions";
import { BudgetAnnualTransactions } from "@sheets/classes/BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "@sheets/classes/BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "@sheets/classes/BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "@sheets/classes/CheckFixedAmounts";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";

export function dailySendHtmlEmail(): void {
  const spreadsheet = getFinancesSpreadsheet();
  const bankDebitsDue = new BankDebitsDue(spreadsheet);
  const checkFixedAmounts = new CheckFixedAmounts(spreadsheet);
  const fixedAmountMismatches = checkFixedAmounts.mismatchMessages;

  const howManyDaysAhead = bankDebitsDue.howManyDaysAhead;
  const upcomingDebits = upcomingDebits_(spreadsheet, howManyDaysAhead);

  const subject = `Our finances daily email: ${formatLondonDate(new Date())}`;

  // Build array of lines first
  const lines: string[] = [];

  lines.push(toHtmlH1(subject));

  if (fixedAmountMismatches.length > 0) {
    lines.push(toHtmlH3("Fixed amount mismatches"));
    for (const mismatch of fixedAmountMismatches) {
      lines.push(mismatch);
    }
  }

  if (upcomingDebits.length > 0) {
    lines.push(toHtmlH2(toHtmlH2("Upcoming debits")));
    lines.push(
      renderBankDebitsDueSummaryHtml(bankDebitsDue.getUpcomingDebitsSummary())
    );
    for (const debits of upcomingDebits) {
      if (debits.rows.length) {
        lines.push(toHtmlH3(debits.section));
        lines.push(renderUpcomingDebitsAsHtmlTable(debits.rows));
      }
    }
  }

  lines.push(htmlHorizontalRule());

  // Add footer with spreadsheet URL
  lines.push(`Sent from (dailySendHtmlEmail): ${spreadsheet.url}`);

  // Generate HTML body: wrap each line in <p>
  const htmlBody = lines.map((line) => toHtmlParagraph(line)).join("");

  // Send email
  sendMeHtmlEmail(subject, htmlBody);
}

function upcomingDebits_(
  spreadsheet: Spreadsheet,
  howManyDaysAhead: number
): UpcomingDebit[] {
  // Collect upcoming debits from different sources
  const budgetAdhocTransactions = new BudgetAdHocTransactions(spreadsheet);
  const budgetAnnualTransactions = new BudgetAnnualTransactions(spreadsheet);
  const budgetMonthlyTransactions = new BudgetMonthlyTransactions(spreadsheet);
  const budgetWeeklyTransactions = new BudgetWeeklyTransactions(spreadsheet);
  return [
    {
      section: "Ad hoc",
      rows: budgetAdhocTransactions.getUpcomingDebits(howManyDaysAhead),
    },
    {
      section: "Annual",
      rows: budgetAnnualTransactions.getUpcomingDebits(howManyDaysAhead),
    },
    {
      section: "Monthly",
      rows: budgetMonthlyTransactions.getUpcomingDebits(howManyDaysAhead),
    },
    {
      section: "Weekly",
      rows: budgetWeeklyTransactions.getUpcomingDebits(howManyDaysAhead),
    },
  ];
}
