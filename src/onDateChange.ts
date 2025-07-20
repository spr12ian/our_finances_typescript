/// <reference types="google-apps-script" />

import { BankAccounts } from "./BankAccounts";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { OurFinances } from "./OurFinances";
import { activeSpreadsheet } from "./context";

// Function declarations

function dailySorts() {
  const sheetsToSort = [
    BankAccounts.SHEET.NAME,
    BudgetAnnualTransactions.SHEET.NAME,
    "Budget monthly transactions",
    "Budget weekly transactions",
    "Description replacements",
    "Transactions categories",
  ];
  sheetsToSort.forEach((sheetName) => {
    const sheet = activeSpreadsheet.name;
    if (sheet) {
      sortSheetByFirstColumnOmittingHeader(sheet);
    } else {
      throw new Error(`${sheetName} not found`);
    }
  });
}

function dynamicQuery(rangeString, queryString) {
  try {
    // Import QUERY function from DataTable
    const dataTable = Charts.newDataTable()
      .addColumn("Column", "string")
      .build();

    rangeString = rangeString.trim();
    queryString = queryString.trim();

    const result = dataTable.applyQuery(rangeString + "," + queryString);
    return result.toArray();
  } catch (error) {
    console.error("Error in dynamicQuery:", error);
    throw error;
  }
}

function examineObject(object, name = "anonymous value") {
  if (typeof object === "object" && object !== null) {
    const keys = Object.keys(object);

    const ownPropertyNames = Object.getOwnPropertyNames(object);

    // Get own properties
    const ownDescriptors = Object.getOwnPropertyDescriptors(object);

    // Get prototype properties (including greet)
    const prototypeDescriptors = Object.getOwnPropertyDescriptors(
      Object.getPrototypeOf(object)
    );
  }
}

function findRowByKey(sheetName, keyColumn, keyValue) {
  const sheet = activeSpreadsheet.getSheetByName(sheetName);
  const data = sheet
    .getRange(`${keyColumn}1:${keyColumn}${sheet.getLastRow()}`)
    .getValues();

  const rowIndex = data.findIndex((row) => row[0] === keyValue);
  return rowIndex !== -1 ? rowIndex + 1 : -1; // Add 1 for 1-based indexing, return -1 if not found
}

function findUsageByNamedRange(namedRange) {
  const sheets = activeSpreadsheet.getSheets();
  const rangeUsage = [];

  sheets.forEach((sheet) => {
    const formulas = sheet.getDataRange().getFormulas();

    formulas.forEach((rowFormulas, rowIndex) => {
      rowFormulas.forEach((formula, colIndex) => {
        if (formula.includes(namedRange)) {
          const cellRef = sheet
            .getRange(rowIndex + 1, colIndex + 1)
            .getA1Notation();
          rangeUsage.push(`Sheet: ${sheet.getName()} - Cell: ${cellRef}`);
        }
      });
    });
  });
}

// The getDate() method of Date instances returns the day of the month for this date according to local time.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate
function getDayOfMonth(date) {
  return date.getDate();
}

function getFirstRowRange(sheet) {
  const lastColumn = sheet.getLastColumn();
  const firstRowRange = sheet.getRange(1, 1, 1, lastColumn);
  return firstRowRange;
}

// https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
function getFormattedDate(date, timeZone, format) {
  return Utilities.formatDate(date, timeZone, format);
}

function getHMRCTotalByYear(category, year) {
  return category + "-" + year;
}

function getLastUpdatedColumn(sheet) {
  const lastUpdated = "Last Updated";
  let lastUpdatedColumn;
  const firstRowRange = getFirstRowRange(sheet);
  const values = firstRowRange.getValues();
  for (let row in values) {
    for (let col in values[row]) {
      const cell = values[row][col];

      newCell = cell.replace(/\n/g, " ");

      if (newCell == lastUpdated) {
        const lastUpdatedColumnNbr = 1 + parseInt(col, 10);
        const lastUpdatedCell = firstRowRange.getCell(1, lastUpdatedColumnNbr);
        const lastUpdatedColumnA1 = lastUpdatedCell.getA1Notation();
        lastUpdatedColumn = lastUpdatedColumnA1.replace(/[0-9]/g, "");
        break;
      }
    }
  }

  return lastUpdatedColumn;
}

function getLineNumber() {
  try {
    throw new Error();
  } catch (e) {
    // Extract line number from the stack trace
    const stack = e.stack.split("\n");
    const line = stack[2].match(/:(\d+):\d+\)?$/);
    return line ? line[1] : "unknown";
  }
}

function getMonthIndex(date) {
  return date.getMonth();
}

function getMyEmailAddress() {
  // Use optional chaining to safely access the email address
  const myEmailAddress = getPrivateData()?.["MY_EMAIL_ADDRESS"];

  // Check if the email address exists and log accordingly
  if (myEmailAddress) {
    return myEmailAddress;
  } else {
    console.error("MY_EMAIL_ADDRESS not found in private data");
    return null; // Return null if the email is not found
  }
}

function getOrdinal(number) {
  let selector;

  if (number <= 0) {
    selector = 4;
  } else if ((number > 3 && number < 21) || number % 10 > 3) {
    selector = 0;
  } else {
    selector = number % 10;
  }

  return number + ["th", "st", "nd", "rd", ""][selector];
}

function getOrdinalDate(date) {
  const dayOfMonth = this.getDayOfMonth(date);
  const ordinal = this.getOrdinal(dayOfMonth);
  const monthName = this.getMonthName(date);
  const fullYear = date.getFullYear();

  return `${ordinal} of ${monthName} ${fullYear}`;
}

function getPrivateData() {
  const privateDataId = "1hxcINN1seSzn-sLPI25KmV9t4kxLvZlievc0X3EgMhs";
  const sheet = gasSpreadsheetApp.openById(privateDataId);

  if (!sheet) {
    return;
  }

  // Get data from sheet without header row
  const values = sheet.getDataRange().getValues().slice(1);

  if (values.length === 0) {
    return;
  }

  let keyValuePairs = {};

  values.forEach(([key, value]) => {
    if (key && value) {
      if (key && value) {
        keyValuePairs[key] = value; // Store the key-value pair in the object
      }
    }
  });

  return keyValuePairs;
}

function getReplacementHeadersMap() {
  const bankAccounts = activeSpreadsheet.getSheetByName(
    BankAccounts.SHEET.NAME
  );
  if (!bankAccounts) {
    throw new Error(`Sheet named '${BankAccounts.SHEET.NAME}' not found.`);
  }

  const data = bankAccounts.getDataRange().getValues().slice(1);

  return data.reduce((map, [date, description, credit, debit, note]) => {
    map[description] = replacement;
    return map;
  }, {});
}

function getSeasonName(date) {
  const seasons = ["Winter", "Spring", "Summer", "Autumn"];

  const monthSeasons = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];

  const monthIndex = getMonthIndex(date);
  const seasonIndex = monthSeasons[monthIndex];

  return seasons[seasonIndex];
}

function isCellAccountBalance(sheet, column) {
  const accountBalance = "Account Balance";

  let isCellAccountBalance = false;

  const firstRowRange = getFirstRowRange(sheet);

  const values = firstRowRange.getValues();
  for (const row in values) {
    const cell = values[row][column - 1];

    newCell = cell.replace(/\n/g, " ");

    if (newCell == accountBalance) {
      isCellAccountBalance = true;
      break;
    }
  }

  return isCellAccountBalance;
}

function isCellADate(cell) {
  // Get the value of the specified cell
  const cellValue = cell.getValue();

  // Check if the value is a Date object
  if (
    Object.prototype.toString.call(cellValue) === "[object Date]" &&
    !isNaN(cellValue.getTime())
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Checks if the given range represents a single cell.
 *
 * @param {Range} range - The range to check.
 * @returns {boolean} - Returns true if the range contains only one cell, otherwise false.
 */
function isSingleCell(range) {
  if (
    !range ||
    typeof range.getNumColumns !== "function" ||
    typeof range.getNumRows !== "function"
  ) {
    throw new Error("Invalid input: Expected a Range object.");
  }

  return range.getNumColumns() === 1 && range.getNumRows() === 1;
}

function copyKeys() {
  const transactionsBuilder = new TransactionsBuilder();
  transactionsBuilder.copyIfSheetExists();
}

function mergeTransactions() {
  const transactions = new Transactions();
  const transactionsBuilder = new TransactionsBuilder();
  transactionsBuilder.copyIfSheetExists();
  const transactionFormulas = transactionsBuilder.getTransactionFormulas();

  transactions.updateBuilderFormulas(transactionFormulas);

  transactions.activate();
}

function monthlyUpdate() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showMonthly();
}

// onDateChange is not a Google trigger; it must be created under Triggers (time based)!!!
export function onDateChange() {
  sendDailyEmail();
  dailySorts();
}

function openAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showOpenAccounts();
}

function sendDailyEmail() {
  const ourFinances = new OurFinances();
  const fixedAmountMismatches = ourFinances.getFixedAmountMismatches();
  const upcomingDebits = ourFinances.getUpcomingDebits();

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
  emailBody += `\n\nSent from (sendDailyEmail): ${ourFinances.spreadsheet.getUrl()}\n`;

  // Send the email
  sendMeEmail(subject, emailBody);
}

function sendEmail(recipient, subject, body, options) {
  return GmailApp.sendEmail(recipient, subject, body, options);
}

function sendMeEmail(subject, emailBody, options) {
  const body = `${subject}\n\n${emailBody}`;
  return sendEmail(getMyEmailAddress(), subject, body, options);
}

function setLastUpdatedOnAccountBalanceChange(sheet) {
  if (isAccountSheet(sheet)) {
    const bankAccounts = new BankAccounts();

    const key = sheet.getSheetName().slice(1);

    bankAccounts.updateLastUpdatedByKey(key);
  }
}

function sortGoogleSheets() {
  const ss = activeSpreadsheet;

  // Store all the worksheets in this array
  const sheetNameArray = [];
  const sheets = ss.getSheets();
  sheets.forEach((sheet) => {
    sheetNameArray.push(sheet.getName());
  });

  sheetNameArray.sort();

  // Reorder the sheets.
  for (let j = 0; j < sheets.length; j++) {
    ss.setActiveSheet(ss.getSheetByName(sheetNameArray[j]));
    ss.moveActiveSheet(j + 1);
  }
}

function sortSheetByFirstColumn(sheet) {
  // Get the range that contains data
  const dataRange = sheet.getDataRange();

  // Sort the range by the first column (column 1) in ascending order
  dataRange.sort({ column: 1, ascending: true });
}

function sortSheetByFirstColumnOmittingHeader(sheet) {
  // Get the range that contains data
  const dataRange = sheet.getDataRange();

  // Get the number of rows and columns
  const numRows = dataRange.getNumRows();
  const numCols = dataRange.getNumColumns();

  // Get the range excluding the first row
  const rangeToSort = sheet.getRange(2, 1, numRows - 1, numCols);

  // Sort the range by the first column (column 1) in ascending order
  rangeToSort.sort({ column: 1, ascending: true });
}
