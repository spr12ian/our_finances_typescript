/// <reference types="google-apps-script" />

import { OurFinances } from "./OurFinances";
import { Sheet } from "./Sheet";
import { SpreadsheetSummary } from "./SpreadsheetSummary";

// Function declarations

// Eagerly compute once for performance
export const accountSheetNames: string[] = new SpreadsheetSummary()
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

export function columnNumberToLetter(columnNumber: number): string {
  let dividend = columnNumber;
  let letter = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return letter;
}

function convertCurrentColumnToUppercase() {
  const sheet = gasSpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const START_ROW = 2;
  const column = activeRange.getColumn();

  const lastRow = sheet.getLastRow();
  const numRows = lastRow + 1 - START_ROW;

  const range = sheet.getRange(START_ROW, column, numRows, 1);
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

function emailUpcomingPayments() {
  const ourFinances = new OurFinances();
  ourFinances.emailUpcomingPayments();
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

function formatSheet() {
  const activeSheet = activeSpreadsheet.getActiveSheet();

  if (!activeSheet) {
    return;
  }

  const accountSheet = new AccountSheet(activeSheet);
  accountSheet.formatSheet();
}

/**
 * Formats an amount for display as GBP
 * @param {number} amount - The amount to format
 * @return {string} Formatted amount
 */
function getAmountAsGBP(amount) {
  const gbPound = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "GBP",
  });

  return gbPound.format(amount);
}

function getDayName(date) {
  const dayName = date.toLocaleDateString(locale, { weekday: "long" });
  return dayName;
}

// The getDate() method of Date instances returns the day of the month for this date according to local time.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate
function getDayOfMonth(date) {
  return date.getDate();
}

function getDtf() {
  return new Intl.DateTimeFormat(locale);
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

function getMonthName(date) {
  return date.toLocaleDateString(locale, { month: "long" });
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

// The getDate() method of Date instances returns the day of the month for this date according to local time.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate
export function getNewDate(date: string): Date {
  let newDate;
  if (date) {
    newDate = new Date(date);
  } else {
    newDate = new Date();
  }
  return newDate;
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

export function getSheetNamesByType(sheetNameType: string) {
  let sheetNames;

  const spreadsheetSummary = new SpreadsheetSummary();
  // Process based on sheetNameType
  switch (sheetNameType) {
    case "account":
      sheetNames = accountSheetNames;
      break;
    case "all":
      // Return all sheet names
      sheetNames = spreadsheetSummary.getSheetNames();
      break;
    default:
      throw new Error(`Unexpected sheetNameType: ${sheetNameType}`);
  }
  return sheetNames;
}

function getToday(
  options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
) {
  const date = new Date();
  let today;

  try {
    const dtf = new Intl.DateTimeFormat(locale, options);
    today = dtf.format(date);
  } catch (error) {
    today = date.toLocaleDateString(locale, options); // Fallback to toLocaleDateString
  }

  return today;
}

function goToSheet(sheetName) {
  const sheet = new Sheet(sheetName);

  // Check if the sheet exists before trying to activate it.
  if (sheet) {
    sheet.activate();
  }
}

export function goToSheetLastRow(sheetName: string) {
  const sheet = new Sheet(sheetName);
  sheet.setActiveRange(sheet.getRange(sheet.getLastRow(), 1));
}

function goToSheet_AHALIF() {
  goToSheet("_AHALIF");
}

function goToSheet_CVITRA() {
  goToSheet("_CVITRA");
}

function goToSheet_SVI2TJ() {
  goToSheet("_SVI2TJ");
}

function goToSheet_SVIGBL() {
  goToSheet("_SVIGBL");
}

function goToSheet_SVIIRF() {
  goToSheet("_SVIIRF");
}

function goToSheetCategories() {
  goToSheet("Categories");
}

function goToSheetCategoryClash() {
  goToSheet("Category clash");
}

function goToSheetHMRC_B() {
  goToSheet(HMRC_B.SHEET_NAME);
}

function goToSheetHMRC_S() {
  goToSheet(HMRC_S.SHEET.NAME);
}

function goToSheetHMRCTransactionsSummary() {
  goToSheet("HMRC Transactions Summary");
}

function goToSheetLoanGlenburnie() {
  goToSheet("Loan Glenburnie");
}

function goToSheetNotInTransactionCategories() {
  goToSheet("Not in transaction categories");
}

function goToSheetPeople() {
  goToSheet("People");
}

function goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
}

function goToSheetTransactionsBuilder() {
  goToSheet("Transactions builder");
}

function goToSheetTransactionsByDate() {
  goToSheet("Transactions by date");
}

function goToSheetTransactionsCategories() {
  goToSheet("Transactions categories");
}

function goToSheetUnlabelledByDate() {
  goToSheet("Uncategorised by date");
}

function goToSheetXfersMismatch() {
  goToSheet("Xfers mismatch");
}

function isAccountSheet(sheet) {
  if (sheet.getSheetName().startsWith("_")) return true;
  return false;
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

function onEdit(event) {
  const trigger = new Trigger(event);
  const sheet = trigger.getSheet();
  const sheetName = trigger.getSheetName();

  if (sheetName == HMRC_S.SHEET.NAME) {
    const hmrcS = new HMRC_S();
    hmrcS.handleEdit(trigger);
  }

  const bankAccounts = new BankAccounts();
  bankAccounts.updateLastUpdatedBySheet(sheet);
}

function openAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showOpenAccounts();
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

function setupDaysIterator(startDate) {
  const getNextResult = (iteratorDate) => {
    const date = cloneDate(iteratorDate); // Default date in long format
    const day = getDtf().format(date); // 19/01/1964
    const dayName = getDayName(date); // Sunday
    const dayOfMonth = getDayOfMonth(date); // 29
    const season = getSeasonName(date); // Winter, Spring, Summer, Autumn

    // Return result as an object
    return { date, day, dayName, dayOfMonth, season };
  };

  const iteratorDate = new Date(startDate);
  const first = getNextResult(iteratorDate);

  const iterator = {
    next: () => {
      iteratorDate.setDate(iteratorDate.getDate() + 1);
      return getNextResult(iteratorDate);
    },
  };

  return { first, iterator };
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

function toValidFunctionName(str) {
  // Remove non-alphanumeric characters, except for letters and digits, replace them with underscores
  let validName = str.trim().replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  return /^[a-zA-Z_]/.test(validName) ? validName : `_${validName}`;
}

function trimGoogleSheet(iswSheet) {
  let sheet;
  if (iswSheet) {
    sheet = iswSheet;
  } else {
    sheet = activeSpreadsheet.getActiveSheet();
  }

  sheet.trimSheet();
}

function trimGoogleSheets() {
  const sheets = activeSpreadsheet.getSheets();
  sheets.forEach((sheet) => {
    sheet.trimSheet();
  });
}

function updateSpreadsheetSummary() {
  const spreadsheetSummary = new SpreadsheetSummary();
  const sheets = activeSpreadsheet.getSheets();
  const sheetData = sheets.map((sheet) => [
    sheet.getSheetName(),
    sheet.getLastRow(),
    sheet.getLastColumn(),
    sheet.getMaxRows(),
    sheet.getMaxColumns(),
    sheet.getSheetName().startsWith("_"),
    sheet.getSheetName().startsWith("Budget"),
  ]);

  // Add headers
  sheetData.unshift([
    "Sheet name",
    "Last row",
    "Last column",
    "Max rows",
    "Max columns",
    "Is an account file (starts with underscore)?",
    "Is a budget file (starts with Budget)?",
  ]);

  const maxWidth = sheetData[0].length;

  // Minimize calls to Google Sheets API by using clearContent instead of clear() if possible.
  const summarySheet = spreadsheetSummary.getSheet();
  summarySheet.clearContents();
  summarySheet.getRange(1, 1, sheetData.length, maxWidth).setValues(sheetData);

  trimGoogleSheet(summarySheet);
}

/**
 * Custom XLOOKUP function for Google Apps Script
 *
 * @param {string|number} searchValue - The value you are searching for.
 * @param {Sheet} sheet - The sheet where the lookup is performed.
 * @param {string} searchCol - The column letter to search in (e.g., 'A').
 * @param {string} resultCol - The column letter for the result (e.g., 'B').
 * @param {boolean} [exactMatch=true] - Whether to look for exact matches.
 * @returns {string|number|null} The result of the lookup or null if not found.
 */
function xLookup(searchValue, sheet, searchCol, resultCol, exactMatch = true) {
  const searchRange = sheet.getRange(`${searchCol}1:${searchCol}`).getValues();
  const resultRange = sheet.getRange(`${resultCol}1:${resultCol}`).getValues();

  for (let i = 0; i < searchRange.length; i++) {
    const cellValue = searchRange[i][0];

    // Handle exact or approximate match cases
    if (
      (exactMatch && cellValue === searchValue) ||
      (!exactMatch &&
        cellValue
          .toString()
          .toLowerCase()
          .includes(searchValue.toString().toLowerCase()))
    ) {
      return resultRange[i][0]; // Return the corresponding result value
    }
  }

  return null; // Return null if no match is found
}
