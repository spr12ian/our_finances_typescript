import type { OneBased } from "../types/oneBased";
import { oneBased } from "../types/oneBased";

export const ACCOUNT_PREFIX = "_";
export const LOCALE = "en-GB" as const;

export const MetaAccountBalances = {
  COLUMNS: {
    ACCOUNT: oneBased(1),
    CREDIT: oneBased(2),
    DEBIT: oneBased(3),
    NETT: oneBased(4),
  } as const satisfies Record<string, OneBased<number>>,
  FORMULA_CONFIG: [
    {
      cell: "A1",
      formula:
        "=QUERY('Transactions'!A1:E,\"SELECT A,SUM(D),SUM(E) GROUP BY A\")",
    },
    {
      cell: "D1",
      formula: '={"Balance (£)"; ARRAYFORMULA(IF(A2:A<>"", B2:B - C2:C, ""))}',
    },
  ] as { cell: string; formula: string }[],
  HEADERS: ["Account", "Credit (£)", "Debit (£)", "Nett (£)"],
  ROW_DATA_STARTS: 2,
  SHEET: { NAME: "Account balances" },
};

export const MetaAccountSheet = {
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    CREDIT: oneBased(3),
    DEBIT: oneBased(4),
    NOTE: oneBased(5),
    COUNTERPARTY: oneBased(6),
    COUNTERPARTY_DATE: oneBased(7),
    BALANCE: oneBased(8),
  } as const satisfies Record<string, OneBased<number>>,
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

export const MetaAssets = {
  FORMULA_CONFIG: [
    {
      cell: "B2",
      formula:
        "=QUERY('Bank accounts'!$M$1:$AL,\"SELECT SUM(M) WHERE M > 1 AND AL = TRUE LABEL SUM(M) ''\")",
    },
    { cell: "B3", formula: "=Shares!F4" },
    { cell: "B4", formula: "='Money owed to us'!B2" },
    {
      cell: "B5",
      formula:
        "=XLOOKUP(\"Institution Total\",'Pension Vanguard'!A2:A,'Pension Vanguard'!D2:D)",
    },
    {
      cell: "B6",
      formula:
        "=XLOOKUP(\"Fund value\",'Pension Zurich'!A2:A,'Pension Zurich'!B2:B)",
    },
    { cell: "B7", formula: "=Property!C2" },
  ] as { cell: string; formula: string }[],
  SHEET: { NAME: "Assets" },
};

export const MetaBMONZO = {
  FORMULA_CONFIG: [
    {
      cell: "A1",
      formula:
        '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/11EkOxSPkTAUi4fbbBe2gsieHvkKWO8MiFKlT35LRQEw/edit?usp=drive_link","A1:R")',
    },
  ] as { cell: string; formula: string }[],
  SHEET: { NAME: "BMONZO" },
};

export const MetaBalanceSheet = {
  SHEET: { NAME: "Balance sheet" },
};

// Split KEY_LABEL out so COLUMNS can be strictly numeric & branded
export const MetaBankAccounts = {
  COLUMNS: {
    BALANCE: oneBased(13),
    BALANCE_UPDATED: oneBased(19),
    CHECK_BALANCE_FREQUENCY: oneBased(12),
    DATE_CLOSED: oneBased(11),
    KEY: oneBased(1),
    OWNER_CODE: oneBased(3),
  } as const satisfies Record<string, OneBased<number>>,
  LABELS: {
    KEY_LABEL: "A" as const,
  },
  FREQUENCY: {
    DAILY: "Daily",
    MONTHLY: "Monthly",
    NEVER: "Never",
    WEEKLY: "Weekly",
  },
  OWNER_CODES: {
    BRIAN: "A",
    CHARLIE: "C",
    IAN_B: "B",
    IAN_S: "S",
    LINDA_H: "L",
  },
  SHEET: { NAME: "Bank accounts" },
};

export const MetaBudget = {
  SHEET: { NAME: "Budget" },
};

export const MetaBudgetAdHocTransactions = {
  SHEET: { NAME: "Budget ad hoc transactions" },
  COLUMNS: {
    DATE:         oneBased(1),
    DESCRIPTION:  oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    NOTE:         oneBased(5),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(8),
  } as const satisfies Record<string, OneBased<number>>,
};

export const MetaBudgetAnnualTransactions = {
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(5),
    PAYMENT_TYPE: oneBased(6),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget annual transactions" },
};

export const MetaBudgetMonthlyTransactions = {
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(10),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget monthly transactions" },
};

export const MetaBudgetPredictedSpend = {
  COLUMNS: {
    AD_HOC: oneBased(9),
    ANNUAL: oneBased(8),
    BALANCE: oneBased(3),
    CHANGE: oneBased(4),
    DATE: oneBased(2),
    DAY: oneBased(1),
    FOUR_WEEKLY: oneBased(6),
    MONTHLY: oneBased(7),
    WEEKLY: oneBased(5),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget predicted spend" },
};

export const MetaBudgetWeeklyTransactions = {
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(16),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget weekly transactions" },
};

export const MetaCategories = {
  SHEET: { NAME: "Categories" },
};

export const MetaCategoryClash = {
  SHEET: { NAME: "Category clash" },
};

export const MetaCheckFixedAmounts = {
  COLUMNS: {
    TAX_YEAR: oneBased(1),
    CATEGORY: oneBased(2),
    FIXED_AMOUNT: oneBased(3),
    DYNAMIC_AMOUNT: oneBased(5),
    TOLERANCE: oneBased(6),
    MISMATCH: oneBased(7),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: {
    NAME: "Check fixed amounts",
    MIN_COLUMNS: 6,
    HEADER_ROW: 1,
  },
};

export const MetaDescriptionReplacements = {
  SHEET: { NAME: "Description replacements" },
};

export const MetaHMRC_B = {
  SHEET: { NAME: "HMRC B", HEADER_ROW: 1 },
};

export const MetaHMRC_S = {
  COLUMNS: {
    QUESTIONS: oneBased(1),
    CATEGORY: oneBased(2),
    LATEST_TAX_YEAR: oneBased(3),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "HMRC S", HEADER_ROW: 1 },
};

export const MetaNotInTransactionCategories = {
  SHEET: { NAME: "Not in transaction categories" },
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
  NUM_COLUMNS: 4,
  SHEET: { NAME: "Transaction categories" },
  START_ROW: 2,
};

export const MetaTransactions = {
  SHEET: { NAME: "Transactions" },
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
  NUM_COLUMNS: 4,
  SHEET: { NAME: "Transaction categories" },
  START_ROW: 2,
};

export const MetaTransactionsByDate = {
  SHEET: { NAME: "Transactions by date" },
};

export const MetaUncategorisedByDate = {
  SHEET: { NAME: "Uncategorised by date" },
};
