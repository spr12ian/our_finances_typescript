export const ACCOUNT_PREFIX = "_";

export const LOCALE = "en-GB" as const;

export const MetaAccountBalances = {
  FORMULA_CONFIG: [
    {
      cell: "A1",
      formula:
        "=QUERY('Accounts data'!A1:E,\"SELECT A,SUM(D),SUM(E) GROUP BY A\")",
    },
    {
      cell: "D1",
      formula: '={"Balance (£)"; ARRAYFORMULA(IF(A2:A<>"", B2:B - C2:C, ""))}',
    },
  ] as { cell: string; formula: string }[],
  SHEET: {
    NAME: "Account Balances",
  },
};

export const MetaAccountSheet = {
  COLUMNS: {
    DATE: 1,
    DESCRIPTION: 2,
    CREDIT: 3,
    DEBIT: 4,
    NOTE: 5,
    COUNTERPARTY: 6,
    COUNTERPARTY_DATE: 7,
    BALANCE: 8,
  },
  ROW_DATA_STARTS: 2,
  HEADERS: [
    "Date",
    "Description",
    "Credit (£)",
    "Debit (£)",
    "Note",
    "CPTY",
    "Date CPTY",
    "Balance (£)",
  ],
  MINIMUM_COLUMNS: 8,
};

export const MetaAccountsData = {
  SHEET: {
    NAME: "Accounts data",
    HEADER_ROW: 1, // Number of header rows to skip
    HEADER: [
      "Account",
      "Date",
      "Description",
      "Credit (£)",
      "Debit (£)",
      "Note",
      "CPTY",
      "Date CPTY",
    ],
  },
  START_ROW: 2, // Skip header row in each account sheet
  NUM_COLUMNS: 7, // Number of columns to read from each account sheet
};

export const MetaBankAccounts = {
  COLUMNS: {
    KEY: 1,
    OWNER_CODE: 3,
    CHECK_BALANCE_FREQUENCY: 12,
    BALANCE_UPDATED: 19,
    KEY_LABEL: "A",
  },
  OWNER_CODES: {
    BRIAN: "A",
    CHARLIE: "C",
    LINDA: "L",
  },
  SHEET: {
    NAME: "Bank accounts",
  },
};

export const MetaBudget = {
  SHEET: {
    NAME: "Budget",
  },
};

export const MetaBudgetAdHocTransactions = {
  COLUMNS: {
    CHANGE_AMOUNT: 3,
    DATE: 0,
    DESCRIPTION: 1,
    FROM_ACCOUNT: 6,
    PAYMENT_TYPE: 7,
  },
  SHEET: {
    NAME: "Budget ad hoc transactions",
  },
};

export const MetaBudgetAnnualTransactions = {
  COLUMNS: {
    DATE: 0,
    DESCRIPTION: 1,
    CHANGE_AMOUNT: 3,
    FROM_ACCOUNT: 4,
    PAYMENT_TYPE: 5,
  },
  SHEET: {
    NAME: "Budget annual transactions",
  },
};

export const MetaBudgetMonthlyTransactions = {
  COLUMNS: {
    DATE: 0,
    DESCRIPTION: 1,
    DEBIT_AMOUNT: 3,
    FROM_ACCOUNT: 6,
    PAYMENT_TYPE: 9,
  },
  SHEET: {
    NAME: "Budget monthly transactions",
  },
};

export const MetaBudgetWeeklyTransactions = {
  COLUMNS: {
    DATE: 0,
    DESCRIPTION: 1,
    DEBIT_AMOUNT: 3,
    FROM_ACCOUNT: 6,
    PAYMENT_TYPE: 15,
  },
  SHEET: {
    NAME: "Budget weekly transactions",
  },
};

export const MetaCategories = {
  SHEET: {
    NAME: "Categories",
  },
};

export const MetaCategoryClash = {
  SHEET: {
    NAME: "Category clash",
  },
};

export const MetaCheckFixedAmounts = {
  COLUMNS: {
    TAX_YEAR: 0,
    CATEGORY: 1,
    FIXED_AMOUNT: 2,
    DYNAMIC_AMOUNT: 3,
    TOLERANCE: 4,
    MISMATCH: 5,
  },
  SHEET: {
    NAME: "Check fixed amounts",
    MIN_COLUMNS: 6, // Minimum expected columns
    HEADER_ROW: 1, // Number of header rows to skip
  },
};

export const MetaDescriptionReplacements = {
  SHEET: {
    NAME: "Description replacements",
  },
};

export const MetaHMRC_B = {
  SHEET: {
    NAME: "HMRC B",
    HEADER_ROW: 1, // Number of header rows to skip
  },
};

export const MetaHMRC_S = {
  COLUMNS: {
    QUESTIONS: 0,
    CATEGORY: 1,
    LATEST_TAX_YEAR: 2,
  },
  SHEET: {
    NAME: "HMRC S",
    HEADER_ROW: 1, // Number of header rows to skip
  },
};

export const MetaNotInTransactionCategories = {
  SHEET: {
    NAME: "Not in transaction categories",
  },
};

export const MetaSSACRD = {
  FORMULA_CONFIG: [
    {
      cell: "E1",
      formula: '={"Note";ARRAYFORMULA(if(len(I2:I),I2:I&" "&J2:J,J2:J))}',
    },
    {
      cell: "H1",
      formula:
        '={"Balance (£)";ArrayFormula(IF(LEN(C2:C)+LEN(D2:D),MMULT(TRANSPOSE(IF(TRANSPOSE(ROW(C2:C))>=ROW(C2:C),C2:C-D2:D,0)),SIGN(ROW(A2:A))),IFERROR(1/0)))} ',
    },
  ] as { cell: string; formula: string }[],
  NUM_COLUMNS: 4, // Number of columns in the Transaction categories sheet
  SHEET: {
    NAME: "Transaction categories",
  },
  START_ROW: 2, // Skip header row
};

export const MetaTransactions = {
  SHEET: {
    NAME: "Transactions",
  },
};

export const MetaTransactionCategories = {
  FORMULA_CONFIG: [
    {
      cell: "B1",
      formula:
        '={"How Many"; ARRAYFORMULA(IF(LEN(A2:A), COUNTIF(Transactions!$L$1:$L, A2:A), )) }',
    },
    {
      cell: "D1",
      formula:
        '={"XLOOKUP category"; ARRAYFORMULA(IF(LEN(A2:A), IF(LEN(C2:C), C2:C, "Uncategorised"), ))}',
    },
  ] as { cell: string; formula: string }[],
  NUM_COLUMNS: 4, // Number of columns in the Transaction categories sheet
  SHEET: {
    NAME: "Transaction categories",
  },
  START_ROW: 2, // Skip header row
};

export const MetaTransactionsByDate = {
  SHEET: {
    NAME: "Transactions by date",
  },
};

export const MetaUncategorisedByDate = {
  SHEET: {
    NAME: "Uncategorised by date",
  },
};
