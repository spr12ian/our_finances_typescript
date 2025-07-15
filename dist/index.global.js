"use strict";
(() => {
  // src/OurFinances.ts
  var OurFinances = class {
    constructor() {
      this.spreadsheet = activeSpreadsheet;
    }
    getFixedAmountMismatches() {
      return this.checkFixedAmounts.getMismatchMessages();
    }
    getUpcomingDebits() {
      return [
        this.bankDebitsDue.getUpcomingDebits(),
        this.budgetAdhocTransactions.getUpcomingDebits(),
        this.budgetAnnualTransactions.getUpcomingDebits(),
        this.budgetMonthlyTransactions.getUpcomingDebits(),
        this.budgetWeeklyTransactions.getUpcomingDebits()
      ];
    }
    get budgetAnnualTransactions() {
      if (typeof this._budgetAnnualTransactions === "undefined") {
        this._budgetAnnualTransactions = new BudgetAnnualTransactions(this);
      }
      return this._budgetAnnualTransactions;
    }
    get budgetAdhocTransactions() {
      if (typeof this._budgetAdhocTransactions === "undefined") {
        this._budgetAdhocTransactions = new BudgetAdhocTransactions(this);
      }
      return this._budgetAdhocTransactions;
    }
    get bankAccounts() {
      if (typeof this._bankAccounts === "undefined") {
        this._bankAccounts = new BankAccounts(this);
      }
      return this._bankAccounts;
    }
    get bankDebitsDue() {
      if (typeof this._bankDebitsDue === "undefined") {
        this._bankDebitsDue = new BankDebitsDue(this);
      }
      return this._bankDebitsDue;
    }
    get checkFixedAmounts() {
      if (typeof this._checkFixedAmounts === "undefined") {
        this._checkFixedAmounts = new CheckFixedAmounts(this);
      }
      return this._checkFixedAmounts;
    }
    get howManyDaysAhead() {
      if (typeof this._howManyDaysAhead === "undefined") {
        const sheetName = "Bank debits due";
        const sheet = this.getSheetByName(sheetName);
        const searchValue = "Look ahead";
        this._howManyDaysAhead = xLookup(searchValue, sheet, "F", "G");
      }
      return this._howManyDaysAhead;
    }
    get budgetMonthlyTransactions() {
      if (typeof this._budgetMonthlyTransactions === "undefined") {
        this._budgetMonthlyTransactions = new BudgetMonthlyTransactions(this);
      }
      return this._budgetMonthlyTransactions;
    }
    get budgetWeeklyTransactions() {
      if (typeof this._budgetWeeklyTransactions === "undefined") {
        this._budgetWeeklyTransactions = new BudgetWeeklyTransactions(this);
      }
      return this._budgetWeeklyTransactions;
    }
    getName() {
      return this.spreadsheet.getName();
    }
    getSheetByName(sheetName) {
      return this.spreadsheet.getSheetByName(sheetName);
    }
    showAllAccounts() {
      this.bankAccounts.showAll();
    }
  };

  // src/SpreadsheetSummary.ts
  var SpreadsheetSummary = class _SpreadsheetSummary {
    static get COLUMNS() {
      return {
        SHEET_NAME: 0,
        LAST_ROW: 1,
        LAST_COL: 2,
        MAX_ROWS: 3,
        MAX_COLS: 4,
        IS_ACCOUNT: 5,
        IS_BUDGET: 6
      };
    }
    static get SHEET() {
      return {
        NAME: "Spreadsheet summary"
      };
    }
    constructor() {
      this.sheet = new Sheet(_SpreadsheetSummary.SHEET.NAME);
      this.data = this.sheet.getDataRange().offset(1, 0).getValues();
    }
    getBudgetSheetNames() {
      return this.data.filter((row) => row[_SpreadsheetSummary.COLUMNS.IS_BUDGET]).map((row) => row[_SpreadsheetSummary.COLUMNS.SHEET_NAME]);
    }
    getSheetNames() {
      return this.data.map((row) => row[_SpreadsheetSummary.COLUMNS.SHEET_NAME]);
    }
    update() {
      const sheetData = activeSpreadsheet.getSheets().map((iswSheet) => ({
        sheetName: iswSheet.getSheetName(),
        lastRow: iswSheet.getLastRow(),
        lastColumn: iswSheet.getLastColumn(),
        maxRows: iswSheet.getMaxRows(),
        maxColumns: iswSheet.getMaxColumns(),
        isAccount: iswSheet.getSheetName().startsWith("_"),
        isBudget: iswSheet.getSheetName().startsWith("Budget")
      }));
      sheetData.unshift({
        sheetName: "Sheet name",
        lastRow: "Last row",
        lastColumn: "Last column",
        maxRows: "Max rows",
        maxColumns: "Max columns",
        isAccount: "Is an account file (starts with underscore)?",
        isBudget: "Is a budget file (starts with Budget)?"
      });
      const sheetArray = sheetData.map((sheet) => [
        sheet.sheetName,
        sheet.lastRow,
        sheet.lastColumn,
        sheet.maxRows,
        sheet.maxColumns,
        sheet.isAccount,
        sheet.isBudget
      ]);
      const maxWidth = sheetArray[0].length;
      this.sheet.clearContents();
      this.sheet.getRange(1, 1, sheetArray.length, maxWidth).setValues(sheetArray);
    }
    getSheet() {
      return this.sheet;
    }
    getSheetName() {
      return this.sheet.getSheetName();
    }
  };

  // src/functions.ts
  function getSheetNamesByType(sheetNameType) {
    let sheetNames;
    const spreadsheetSummary = new SpreadsheetSummary();
    switch (sheetNameType) {
      case "account":
        sheetNames = getAccountSheetNames();
        break;
      case "all":
        sheetNames = spreadsheetSummary.getSheetNames();
        break;
      default:
        throw new Error(`Unexpected sheetNameType: ${sheetNameType}`);
    }
    return sheetNames;
  }
  function getType(value) {
    if (value === null) {
      return "null";
    }
    const baseType = typeof value;
    if (!["object", "function"].includes(baseType)) {
      return baseType;
    }
    const tag = value[Symbol.toStringTag];
    if (typeof tag === "string") {
      return tag;
    }
    if (baseType === "function" && Function.prototype.toString.call(value).startsWith("class")) {
      return "class";
    }
    const className = value.constructor.name;
    if (typeof className === "string" && className !== "") {
      return className;
    }
    return baseType;
  }
  function goToSheetLastRow(sheetName) {
    const sheet = new Sheet(sheetName);
    sheet.setActiveRange(sheet.getRange(sheet.getLastRow(), 1));
  }

  // src/Sheet.ts
  var Sheet = class _Sheet {
    constructor(sheet) {
      this.sheet = sheet;
    }
    static from(input) {
      const xType = getType(input);
      if (xType === "string") {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(input);
        if (!sheet) {
          throw new Error(`Sheet with name "${input}" not found`);
        }
        return new _Sheet(sheet);
      }
      if (xType === "object" && input instanceof _Sheet) {
        return input;
      }
      if (xType === "object" && input instanceof GoogleAppsScript.Spreadsheet.Sheet) {
        return new _Sheet(input);
      }
      if (input === null) {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        if (!sheet) {
          throw new Error("No active sheet found");
        }
        return new _Sheet(sheet);
      }
      throw new TypeError(`Unexpected input type: ${xType}`);
    }
    get spreadsheet() {
      if (!this._spreadsheet) {
        this._spreadsheet = Spreadsheet.from(this.sheet.getParent().getId());
      }
      return this._spreadsheet;
    }
    get spreadsheetName() {
      if (!this._spreadsheetName) {
        this._spreadsheetName = this.spreadsheet.name;
      }
      return this._spreadsheetName;
    }
    activate() {
      this.sheet.activate();
    }
    clear() {
      this.sheet.clear();
    }
    clearContents() {
      this.sheet.clearContents();
    }
    deleteExcessColumns() {
      const frozenColumns = this.sheet.getFrozenColumns();
      const lastColumn = this.sheet.getLastColumn();
      const maxColumns = this.sheet.getMaxColumns();
      const startColumn = Math.max(lastColumn + 1, frozenColumns + 2);
      const howMany = maxColumns - startColumn + 1;
      if (howMany > 0) {
        this.sheet.deleteColumns(startColumn, howMany);
      }
    }
    deleteExcessRows() {
      const frozenRows = this.sheet.getFrozenRows();
      const lastRow = this.sheet.getLastRow();
      const startRow = lastRow <= frozenRows ? frozenRows + 2 : lastRow + 1;
      const maxRows = this.sheet.getMaxRows();
      const howMany = maxRows - startRow + 1;
      if (howMany > 0) {
        this.sheet.deleteRows(startRow, howMany);
      }
    }
    deleteRows(startRow, howMany) {
      this.sheet.deleteRows(startRow, howMany);
    }
    getDataRange() {
      return this.sheet.getDataRange();
    }
    getValue(range) {
      return this.sheet.getRange(range).getValue();
    }
    setValue(range, value) {
      this.sheet.getRange(range).setValue(value);
    }
    getRange(a1Notation) {
      return this.sheet.getRange(a1Notation);
    }
    getSheetName() {
      return this.sheet.getSheetName();
    }
    getSheetId() {
      return this.sheet.getSheetId();
    }
    setColumnWidth(column, width) {
      this.sheet.setColumnWidth(column, width);
    }
    setActiveCell(range) {
      if (typeof range === "string") {
        this.sheet.setActiveCell(this.sheet.getRange(range));
      } else {
        this.sheet.setActiveCell(range);
      }
    }
    setActiveRange(range) {
      this.sheet.setActiveRange(range);
    }
    showColumns(start, num) {
      this.sheet.showColumns(start, num);
    }
    hideColumn(column) {
      this.sheet.hideColumn(column);
    }
    trimSheet() {
      this.deleteExcessColumns();
      this.deleteExcessRows();
      return this;
    }
    // Expose raw GAS sheet when necessary
    get raw() {
      return this.sheet;
    }
  };

  // src/Spreadsheet.ts
  var Spreadsheet = class _Spreadsheet {
    constructor(ss) {
      this.ss = ss;
    }
    /**
     * Factory: open by ID or fall back to the active spreadsheet.
     */
    static from(id) {
      const ss = typeof id === "string" && id.trim() ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
      if (!ss) {
        throw new Error("Unable to obtain a spreadsheet instance");
      }
      return new _Spreadsheet(ss);
    }
    // ────────────────────────────────────────────────────────────
    //  Metadata getters
    // ────────────────────────────────────────────────────────────
    get name() {
      return this.ss.getName();
    }
    get url() {
      return this.ss.getUrl();
    }
    // ────────────────────────────────────────────────────────────
    //  Sheet access helpers
    // ────────────────────────────────────────────────────────────
    get activeSheet() {
      return Sheet.from(this.ss.getActiveSheet());
    }
    get sheets() {
      return this.ss.getSheets().map((s) => Sheet.from(s));
    }
    sheetByName(name) {
      var _a;
      return (_a = this.sheetMap.get(name)) != null ? _a : null;
    }
    get sheetMap() {
      if (!this._sheetCache) {
        const entries = this.sheets.map((s) => [s.getSheetName(), s]);
        this._sheetCache = new Map(entries);
      }
      return this._sheetCache;
    }
    // ────────────────────────────────────────────────────────────
    //  Spreadsheet‑level operations
    // ────────────────────────────────────────────────────────────
    moveActiveSheetTo(position) {
      this.ss.moveActiveSheet(position);
    }
    newFilterCriteria() {
      return SpreadsheetApp.newFilterCriteria();
    }
    toast(message, title = "", timeoutSeconds = 5) {
      this.ss.toast(message, title, timeoutSeconds);
    }
    // ────────────────────────────────────────────────────────────
    //  Escape hatch – expose the underlying GAS Spreadsheet
    // ────────────────────────────────────────────────────────────
    get raw() {
      return this.ss;
    }
  };

  // src/onDateChange.ts
  function dailySorts() {
    const sheetsToSort = [
      BankAccounts.SHEET.NAME,
      BudgetAnnualTransactions.SHEET.NAME,
      "Budget monthly transactions",
      "Budget weekly transactions",
      "Description replacements",
      "Transactions categories"
    ];
    sheetsToSort.forEach((sheetName) => {
      const sheet = activeSpreadsheet.getSheetByName(sheetName);
      if (sheet) {
        sortSheetByFirstColumnOmittingHeader(sheet);
      } else {
        throw new Error(`${sheetName} not found`);
      }
    });
  }
  function getMyEmailAddress() {
    var _a;
    const myEmailAddress = (_a = getPrivateData()) == null ? void 0 : _a["MY_EMAIL_ADDRESS"];
    if (myEmailAddress) {
      return myEmailAddress;
    } else {
      console.error("MY_EMAIL_ADDRESS not found in private data");
      return null;
    }
  }
  function getPrivateData() {
    const privateDataId = "1hxcINN1seSzn-sLPI25KmV9t4kxLvZlievc0X3EgMhs";
    const sheet = gasSpreadsheetApp.openById(privateDataId);
    if (!sheet) {
      return;
    }
    const values = sheet.getDataRange().getValues().slice(1);
    if (values.length === 0) {
      return;
    }
    let keyValuePairs = {};
    values.forEach(([key, value]) => {
      if (key && value) {
        if (key && value) {
          keyValuePairs[key] = value;
        }
      }
    });
    return keyValuePairs;
  }
  function getToday(options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }) {
    const date = /* @__PURE__ */ new Date();
    let today;
    try {
      const dtf = new Intl.DateTimeFormat(locale, options);
      today = dtf.format(date);
    } catch (error) {
      today = date.toLocaleDateString(locale, options);
    }
    return today;
  }
  function onDateChange() {
    sendDailyEmail();
    dailySorts();
  }
  function sendDailyEmail() {
    const ourFinances = new OurFinances();
    const fixedAmountMismatches = ourFinances.getFixedAmountMismatches();
    const upcomingDebits = ourFinances.getUpcomingDebits();
    const subject = `Our finances daily email: ${getToday()}`;
    let emailBody = ``;
    if (fixedAmountMismatches.length > 0) {
      emailBody += `Fixed amount mismatches
`;
      emailBody += fixedAmountMismatches.join("\n");
      emailBody += `

`;
    }
    if (upcomingDebits.length) {
      emailBody += `Upcoming debits
`;
      emailBody += upcomingDebits.join("\n");
      emailBody += `

`;
    }
    emailBody += `

Sent from (sendDailyEmail): ${ourFinances.spreadsheet.getUrl()}
`;
    sendMeEmail(subject, emailBody);
  }
  function sendEmail(recipient, subject, body, options) {
    return GmailApp.sendEmail(recipient, subject, body, options);
  }
  function sendMeEmail(subject, emailBody, options) {
    const body = `${subject}

${emailBody}`;
    return sendEmail(getMyEmailAddress(), subject, body, options);
  }
  function sortSheetByFirstColumnOmittingHeader(sheet) {
    const dataRange = sheet.getDataRange();
    const numRows = dataRange.getNumRows();
    const numCols = dataRange.getNumColumns();
    const rangeToSort = sheet.getRange(2, 1, numRows - 1, numCols);
    rangeToSort.sort({ column: 1, ascending: true });
  }

  // src/onOpen.ts
  function buildAccountsMenu_(ui, accountSheetNames2) {
    if (accountSheetNames2.length === 0) {
      ui.alert("No account sheets found!");
      return;
    }
    const itemArray = [];
    for (const accountSheetName of accountSheetNames2) {
      const funName = "dynamicAccount" + accountSheetName;
      itemArray.push([accountSheetName, funName]);
    }
    createMenu(ui, "Accounts", itemArray);
  }
  function buildGasMenu_(ui) {
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
      ["Update spreadsheet summary", "updateSpreadsheetSummary"]
    ];
    createMenu(ui, "GAS Menu", itemArray);
  }
  function buildSectionsMenu_(ui) {
    const menu = ui.createMenu("Sections").addSubMenu(
      ui.createMenu("Budget").addItem("Budget", "budget").addItem(
        BudgetAnnualTransactions.SHEET.NAME,
        "budgetAnnualTransactions"
      ).addItem("Budget monthly transactions", "budgetMonthlyTransactions").addItem("Budget ad hoc transactions", "budgetAdhocTransactions").addItem("Budget predicted spend", "budgetPredictedSpend").addItem("Budget weekly transactions", "budgetWeeklyTransactions")
    ).addSeparator().addSubMenu(
      ui.createMenu("Categories").addItem("4 All transactions by date", "goToSheetTransactionsByDate").addItem("5 Assign categories", "goToSheetTransactionsCategories").addItem("1 Categories", "goToSheetCategories").addItem("Category clash", "goToSheetCategoryClash").addItem("7 Merge transactions", "mergeTransactions").addItem("8 Copy keys", "copyKeys").addItem(
        "2 Not in transaction categories",
        "goToSheetNotInTransactionCategories"
      ).addItem("6 Transactions builder", "goToSheetTransactionsBuilder").addItem("3 Uncategorised by date", "goToSheetUnlabelledByDate")
    ).addSeparator().addSubMenu(
      ui.createMenu("Charlie").addItem("Charlie's transactions", "goToSheet_CVITRA")
    ).addSeparator().addSubMenu(
      ui.createMenu("Fownes Street").addItem("Fownes Street Halifax account", "goToSheet_AHALIF").addItem("Fownes Street Ian B HMRC records", "goToSheet_SVI2TJ").addItem("Fownes Street IRF transactions", "goToSheet_SVIIRF")
    ).addSeparator().addSubMenu(
      ui.createMenu("Glenburnie").addItem("Glenburnie investment loan", "goToSheet_SVIGBL").addItem("Glenburnie loan", "goToSheetLoanGlenburnie")
    ).addSeparator().addSubMenu(
      ui.createMenu("HMRC").addItem(
        "HMRC Transactions summary",
        "goToSheetHMRCTransactionsSummary"
      ).addItem("Self Assessment Ian Bernard", "goToSheetHMRC_B").addItem("Self Assessment Ian Sweeney", "goToSheetHMRC_S").addItem("SES Childcare", "goToSheetHMRCTransactionsSummary").addItem("SES Property management", "goToSheetHMRCTransactionsSummary").addItem("TR People", "goToSheetPeople").addItem("UKP Fownes Street", "goToSheetHMRCTransactionsSummary").addItem("UKP One Park West", "goToSheetHMRCTransactionsSummary")
    ).addSeparator().addSubMenu(
      ui.createMenu("SW18 3PT").addItem("Home Assistant inventory", "goToSheetSW183PTInventory").addItem("Inventory", "goToSheetSW183PTInventory")
    ).addSeparator().addItem("Xfers mismatch", "goToSheetXfersMismatch").addToUi();
  }
  function createMenu(ui, menuCaption, menuItemArray) {
    const menu = ui.createMenu(menuCaption);
    menuItemArray.forEach(([itemName, itemFunction]) => {
      menu.addItem(itemName, itemFunction);
    });
    menu.addToUi();
  }
  function getAccountSheetNames2() {
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
      "_SZOPA1"
    ];
  }
  function getSheetNamesByType2(sheetNameType) {
    let sheetNames;
    const spreadsheetSummary = new SpreadsheetSummary();
    switch (sheetNameType) {
      case "account":
        sheetNames = getAccountSheetNames2();
        break;
      case "all":
        sheetNames = spreadsheetSummary.getSheetNames();
        break;
      default:
        throw new Error(`Unexpected sheetNameType: ${sheetNameType}`);
    }
    return sheetNames;
  }
  function onOpen() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      ss.toast("Please wait while I do a few tasks", "Please wait!", 500);
      const ui = SpreadsheetApp.getUi();
      const accountSheetNames2 = getSheetNamesByType2("account");
      buildAccountsMenu_(ui, accountSheetNames2);
      buildGasMenu_(ui);
      buildSectionsMenu_(ui);
      ss.toast("You can do your thing now.", "I'm finished!", 3);
    } catch (err) {
      console.error("onOpen error:", err);
    }
  }

  // src/index.ts
  var LOCALE = "en-GB";
  var activeSpreadsheet2 = Spreadsheet.from();
  var gasSpreadsheetApp2 = activeSpreadsheet2.raw;
  (() => {
    const accountSheetNames2 = getSheetNamesByType("account");
    const helpers = {};
    for (const name of accountSheetNames2) {
      const key = `dynamicAccount${name}`;
      helpers[key] = () => goToSheetLastRow(name);
    }
    Object.assign(globalThis, { accountSheetNames: accountSheetNames2, helpers });
  })();
  Object.assign(globalThis, { onDateChange, onOpen });
})();
