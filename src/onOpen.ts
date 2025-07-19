/// <reference types="google-apps-script" />

import { OurFinances } from "./OurFinances";
import { Sheet } from "./Sheet";
import { SpreadsheetSummary } from "./SpreadsheetSummary";
import { gasSpreadsheetApp } from "./context";
import { getSheetNamesByType } from "./functions";

// Function declarations

function allAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.showAllAccounts();
}

function applyDescriptionReplacements() {
  const activeSheet = activeSpreadsheet.getActiveSheet();
  const accountSheet = new AccountSheet(activeSheet);
  if (accountSheet) {
    accountSheet.applyDescriptionReplacements();
  }
}

function balanceSheet() {
  goToSheet("Balance sheet");
}

function budget() {
  goToSheet("Budget");
}

function budgetAnnualTransactions() {
  goToSheet(BudgetAnnualTransactions.SHEET.NAME);
}

function budgetMonthlyTransactions() {
  goToSheet("Budget monthly transactions");
}

function budgetAdhocTransactions() {
  goToSheet("Budget ad hoc transactions");
}

function budgetPredictedSpend() {
  goToSheet("Budget predicted spend");
}

function budgetWeeklyTransactions() {
  goToSheet("Budget weekly transactions");
}

function checkDependencies() {
  const dependencies = new Dependencies();
  dependencies.updateAllDependencies();
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

function buildAccountsMenu_(
  ui: GoogleAppsScript.Base.Ui,
  accountSheetNames: string[]
): void {
  // accountSheetNames is defined as a global
  //const accountSheetNames = getSheetNamesByType('account');

  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    return;
  }

  const itemArray = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "dynamicAccount" + accountSheetName;
    itemArray.push([accountSheetName, funName]);
  }

  createMenu(ui, "Accounts", itemArray);
}

function buildGasMenu_(ui: GoogleAppsScript.Base.Ui) {
  const itemArray = [
    ["All accounts", "allAccounts"],
    ["Apply Description replacements", "applyDescriptionReplacements"],
    ["Balance sheet", "balanceSheet"],
    ["Check dependencies", "checkDependencies"],
    ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
    ["Daily update", "dailyUpdate"],
    ["Format sheet", "formatSheet"],
    ["Monthly update", "monthlyUpdate"],
    ["Open accounts", "openAccounts"],
    ["Sort sheet order", "sortGoogleSheets"],
    ["Trim all sheets", "trimGoogleSheets"],
    ["Trim sheet", "trimGoogleSheet"],
    ["Update spreadsheet summary", "updateSpreadsheetSummary"],
  ];
  createMenu(ui, "GAS Menu", itemArray);
}

function buildSectionsMenu_(ui: GoogleAppsScript.Base.Ui) {
  const menu = ui
    .createMenu("Sections")
    .addSubMenu(
      ui
        .createMenu("Budget")
        .addItem("Budget", "budget")
        .addItem(
          BudgetAnnualTransactions.SHEET.NAME,
          "budgetAnnualTransactions"
        )
        .addItem("Budget monthly transactions", "budgetMonthlyTransactions")
        .addItem("Budget ad hoc transactions", "budgetAdhocTransactions")
        .addItem("Budget predicted spend", "budgetPredictedSpend")
        .addItem("Budget weekly transactions", "budgetWeeklyTransactions")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Categories")
        .addItem("4 All transactions by date", "goToSheetTransactionsByDate")
        .addItem("5 Assign categories", "goToSheetTransactionsCategories")
        .addItem("1 Categories", "goToSheetCategories")
        .addItem("Category clash", "goToSheetCategoryClash")
        .addItem("7 Merge transactions", "mergeTransactions")
        .addItem("8 Copy keys", "copyKeys")
        .addItem(
          "2 Not in transaction categories",
          "goToSheetNotInTransactionCategories"
        )
        .addItem("6 Transactions builder", "goToSheetTransactionsBuilder")
        .addItem("3 Uncategorised by date", "goToSheetUnlabelledByDate")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Charlie")
        .addItem("Charlie's transactions", "goToSheet_CVITRA")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Fownes Street")
        .addItem("Fownes Street Halifax account", "goToSheet_AHALIF")
        .addItem("Fownes Street Ian B HMRC records", "goToSheet_SVI2TJ")
        .addItem("Fownes Street IRF transactions", "goToSheet_SVIIRF")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Glenburnie")
        .addItem("Glenburnie investment loan", "goToSheet_SVIGBL")
        .addItem("Glenburnie loan", "goToSheetLoanGlenburnie")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("HMRC")
        .addItem(
          "HMRC Transactions summary",
          "goToSheetHMRCTransactionsSummary"
        )
        .addItem("Self Assessment Ian Bernard", "goToSheetHMRC_B")
        .addItem("Self Assessment Ian Sweeney", "goToSheetHMRC_S")
        .addItem("SES Childcare", "goToSheetHMRCTransactionsSummary")
        .addItem("SES Property management", "goToSheetHMRCTransactionsSummary")
        .addItem("TR People", "goToSheetPeople")
        .addItem("UKP Fownes Street", "goToSheetHMRCTransactionsSummary")
        .addItem("UKP One Park West", "goToSheetHMRCTransactionsSummary")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("SW18 3PT")
        .addItem("Home Assistant inventory", "goToSheetSW183PTInventory")
        .addItem("Inventory", "goToSheetSW183PTInventory")
    )
    .addSeparator()
    .addItem("Xfers mismatch", "goToSheetXfersMismatch")
    .addToUi();
}

function createMenu(ui: GoogleAppsScript.Base.Ui, menuCaption:string, menuItemArray) {
  const menu = ui.createMenu(menuCaption);

  menuItemArray.forEach(([itemName, itemFunction]) => {
    menu.addItem(itemName, itemFunction);
  });

  menu.addToUi();
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

function getAccountSheetNames(): string[] {
  // Generated via Python
  return [
    "_AHALIF",
    "_ASANTA",
    "_BCHASE",
    "_BCHRND",
    "_BCHSAV",
    "_BCOISA",
    "_BCOLOY",
    "_BCYNER",
    "_BFAMIL",
    "_BGOLDM",
    "_BHASAV",
    "_BHAULT",
    "_BMETRO",
    "_BMOCHA",
    "_BMOFWN",
    "_BMOKID",
    "_BMONZO",
    "_BMOPAR",
    "_BMOSAV",
    "_BNSPBZ",
    "_BOAISA",
    "_BOAKNO",
    "_BOXBUR",
    "_BPAYPA",
    "_BPOSTO",
    "_BSAISA",
    "_BSANTA",
    "_BSASA2",
    "_BSASA3",
    "_BSASAV",
    "_BSATAX",
    "_BTES01",
    "_BTESCO",
    "_BTRISA",
    "_BVANGA",
    "_BVMISA",
    "_BVMSAV",
    "_BWALLE",
    "_CLLOYD",
    "_CMETRO",
    "_CVITRA",
    "_JFIXES",
    "_JSANTA",
    "_JWALEU",
    "_SAMAZO",
    "_SCHASE",
    "_SCHBST",
    "_SCHRND",
    "_SCHSAV",
    "_SCOIS2",
    "_SCOISA",
    "_SCOLOY",
    "_SFAMIL",
    "_SGOLDM",
    "_SJL3BH",
    "_SKI3BH",
    "_SKROOO",
    "_SMETRO",
    "_SMONZ1",
    "_SMONZO",
    "_SNSPBZ",
    "_SOAISA",
    "_SOAKNO",
    "_SOXBUR",
    "_SPAYPA",
    "_SPOSTO",
    "_SREVOL",
    "_SSACR1",
    "_SSACRD",
    "_SSAISA",
    "_SSANT1",
    "_SSANTA",
    "_SSAPRM",
    "_SSAZ01",
    "_SSAZ02",
    "_SSAZ03",
    "_SSTARB",
    "_SSTARL",
    "_STAFIX",
    "_STASAV",
    "_STES01",
    "_STES02",
    "_STES03",
    "_STESCO",
    "_STRISA",
    "_SVANGA",
    "_SVI2TJ",
    "_SVI3BH",
    "_SVIGB2",
    "_SVIGBL",
    "_SVIIRF",
    "_SVMISA",
    "_SVMSAV",
    "_SWALLE",
    "_SZOPA1",
  ];
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
function getNewDate(date) {
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

export function getType(value) {
  if (value === null) {
    return "null";
  }
  const baseType = typeof value;
  // Primitive types
  if (!["object", "function"].includes(baseType)) {
    return baseType;
  }

  // Symbol.toStringTag often specifies the "display name" of the
  // object's class. It's used in Object.prototype.toString().
  const tag = value[Symbol.toStringTag];
  if (typeof tag === "string") {
    return tag;
  }

  // If it's a function whose source code starts with the "class" keyword
  if (
    baseType === "function" &&
    Function.prototype.toString.call(value).startsWith("class")
  ) {
    return "class";
  }

  // The name of the constructor; for example `Array`, `GeneratorFunction`,
  // `Number`, `String`, `Boolean` or `MyCustomClass`
  const className = value.constructor.name;
  if (typeof className === "string" && className !== "") {
    return className;
  }

  // At this point there's no robust way to get the type of value,
  // so we use the base implementation.
  return baseType;
}

function goToSheet(sheetName) {
  const sheet = new Sheet(sheetName);

  // Check if the sheet exists before trying to activate it.
  if (sheet) {
    sheet.activate();
  }
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

export function onOpen(): void {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Displaying a temporary notification to the user
    ss.toast("Please wait while I do a few tasks", "Please wait!", 500);

    const ui = SpreadsheetApp.getUi();

    const accountSheetNames = getSheetNamesByType("account"); // now safe
    buildAccountsMenu_(ui, accountSheetNames);
    buildGasMenu_(ui);
    buildSectionsMenu_(ui);

    // Notifying the user that the tasks are finished
    ss.toast("You can do your thing now.", "I'm finished!", 3);
  } catch (err) {
    console.error("onOpen error:", err);
  }
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
