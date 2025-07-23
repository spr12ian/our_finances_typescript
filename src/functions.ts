/// <reference types="google-apps-script" />

import { AccountSheet } from "./AccountSheet";
import { OurFinances } from "./OurFinances";
import { Sheet } from "./Sheet";
import { Spreadsheet, Spreadsheet } from './Spreadsheet';
import { SpreadsheetSummary } from "./SpreadsheetSummary";

// Function declarations

// Eagerly compute once for performance
export const accountSheetNames: string[] = new SpreadsheetSummary(
  Spreadsheet.getActive()
)
  .getSheetNames()
  .filter((name: string) => name.startsWith("_"));

function alert(message: string) {
  SpreadsheetApp.getUi().alert(message);
}

function checkDependencies() {
  const dependencies = new Dependencies();
  dependencies.updateAllDependencies();
}

function cloneDate(date) {
  return new Date(date.getTime());
}

function convertCurrentColumnToUppercase() {
  const gasSheet = gasSpreadsheetApp.getActiveSheet();
  const activeRange = gasSheet.getActiveRange();
  const START_ROW = 2;
  const column = activeRange.getColumn();

  const lastRow = gasSheet.getLastRow();
  const numRows = lastRow + 1 - START_ROW;

  const range = gasSheet.getRange(START_ROW, column, numRows, 1);
  const values = range.getValues();
  const uppercasedValues = values.map((row) => [
    row[0].toString().toUpperCase(),
  ]);

  range.setValues(uppercasedValues);
}

function dailyUpdate() {
  const bankAccounts = new BankAccounts();
  bankAccounts.showDaily();
}

export function dynamicQuery(rangeString, queryString) {
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

function emailUpcomingPayments() {
  const ourFinances = new OurFinances();
  ourFinances.emailUpcomingPayments();
}

export function examineObject(object, name = "anonymous value") {
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

function findAllNamedRangeUsage() {
  const sheets = activeSpreadsheet.getSheets();
  const namedRanges = activeSpreadsheet.getNamedRanges();
  const rangeUsage = [];

  if (!namedRanges.length) {
    return;
  }

  // Extract the named range names
  const namedRangeNames = namedRanges.map((range) => range.getName());

  sheets.forEach((sheet) => {
    const formulas = sheet.getDataRange().getFormulas();

    formulas.forEach((rowFormulas, rowIndex) => {
      rowFormulas.forEach((formula, colIndex) => {
        // Only track cells containing named ranges
        if (formula) {
          namedRangeNames.forEach((name) => {
            if (formula.includes(name)) {
              const cellRef = sheet
                .getRange(rowIndex + 1, colIndex)
                .getA1Notation();
              rangeUsage.push(
                `Sheet: ${sheet.getName()} - Cell: ${cellRef} - Name: ${name}`
              );
            }
          });
        }
      });
    });
  });
}

function findNamedRangeUsage() {
  findUsageByNamedRange("BRIAN_HALIFAX_BALANCE");
}

export function findRowByKey(sheetName, keyColumn, keyValue) {
  const sheet = activeSpreadsheet.getSheetByName(sheetName);
  const data = sheet
    .getRange(`${keyColumn}1:${keyColumn}${sheet.getLastRow()}`)
    .getValues();

  const rowIndex = data.findIndex((row) => row[0] === keyValue);
  return rowIndex !== -1 ? rowIndex + 1 : -1; // Add 1 for 1-based indexing, return -1 if not found
}

export function findUsageByNamedRange(namedRange) {
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

function formatSheet() {
  const activeSheet = activeSpreadsheet.getActiveSheet();

  if (!activeSheet) {
    return;
  }

  const accountSheet = new AccountSheet(activeSheet);
  accountSheet.formatSheet();
}

function getDtf() {
  return new Intl.DateTimeFormat(LOCALE);
}

export function getLastUpdatedColumn(sheet: Sheet) {
  const lastUpdated = "Last Updated";
  let lastUpdatedColumn;
  const firstRowRange = sheet.firstRowRange;
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

export function getPrivateData() {
  const privateDataId = "1hxcINN1seSzn-sLPI25KmV9t4kxLvZlievc0X3EgMhs";
  const spreadsheet = Spreadsheet.openById(privateDataId);

  if (!spreadsheet) {
    return;
  }

  // Get data from sheet without header row
  const values = spreadsheet.raw.getDataRange().getValues().slice(1);

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

export function getSheetNamesByType(sheetNameType: string) {
  let sheetNames;
  // Process based on sheetNameType
  switch (sheetNameType) {
    case "account":
      sheetNames = accountSheetNames;
      break;
    case "all":
      const spreadsheet = Spreadsheet.getActive();

      const spreadsheetSummary = new SpreadsheetSummary(spreadsheet);
      // Return all sheet names
      sheetNames = spreadsheetSummary.getSheetNames();
      break;
    default:
      throw new Error(`Unexpected sheetNameType: ${sheetNameType}`);
  }
  return sheetNames;
}

export function goToSheet(sheetName: string) {
  const spreadsheet = Spreadsheet.getActive();

  const sheet = spreadsheet.getSheet(sheetName);

  // Check if the sheet exists before trying to activate it.
  if (sheet) {
    sheet.activate();
  }
}

export function goToSheetLastRow(sheetName: string) {
  const spreadsheet=Spreadsheet.getActive()
  const sheet = spreadsheet.getSheet(sheetName);
  sheet.setActiveRange(sheet.raw.getRange(sheet.raw.getLastRow(), 1));
}

function isAccountSheet(sheet:Sheet) {
  if (sheet.getSheetName().startsWith("_")) return true;
  return false;
}

function isCellAccountBalance(sheet: Sheet, column:number) {
  const accountBalance = "Account Balance";

  let isCellAccountBalance = false;

  const firstRowRange = sheet.firstRowRange;

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

export function logTime(label: string) {
  console.log(`${label}: ${new Date().toISOString()}`);
}

function mergeTransactions() {
  const transactions = new Transactions();
  const transactionsBuilder = new TransactionsBuilder();
  transactionsBuilder.copyIfSheetExists();
  const transactionFormulas = transactionsBuilder.getTransactionFormulas();

  transactions.updateBuilderFormulas(transactionFormulas);

  transactions.activate();
}

function openAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showOpenAccounts();
}

function sendEmail(
  recipient: string,
  subject: string,
  body: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  return GmailApp.sendEmail(recipient, subject, body, options);
}

export function sendMeEmail(
  subject: string,
  emailBody: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  const body = `${subject}\n\n${emailBody}`;
  return sendEmail(getMyEmailAddress(), subject, body, options);
}

export function setLastUpdatedOnAccountBalanceChange(sheet: Sheet) {
  if (isAccountSheet(sheet)) {
    const key = sheet.getSheetName().slice(1);
    const bankAccounts = new OurFinances().bankAccounts;

    bankAccounts.updateLastUpdatedByKey(key);
  }
}

export function toValidFunctionName(str: string) {
  // Remove non-alphanumeric characters, except for letters and digits, replace them with underscores
  let validName = str.trim().replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  return /^[a-zA-Z_]/.test(validName) ? validName : `_${validName}`;
}

export function trimGoogleSheet(iswSheet: Sheet) {
  let sheet;
  if (iswSheet) {
    sheet = iswSheet;
  } else {
    const spreadsheet = Spreadsheet.getActive();
    sheet = spreadsheet.activeSheet;
  }

  sheet.trimSheet();
}
