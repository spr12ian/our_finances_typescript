// constants.ts

import { defineSheetMeta } from "@lib/metaHelpers";
import type { OneBased } from "../types/oneBased";
import { oneBased } from "../types/oneBased";

export const ACCOUNT_PREFIX = "_";
export const LOCALE = "en-GB" as const;

// No SHEET here, so no need for defineSheetMeta
export const MetaAccountSheet = {
  COLUMN_WIDTHS: {
    DATE: 75,
    DESCRIPTION: 490,
    CREDIT: 99,
    DEBIT: 99,
    NOTE: 165,
    COUNTERPARTY: 110,
    COUNTERPARTY_DATE: 75,
    BALANCE: 105,
  },
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

export const MetaAssets = defineSheetMeta({
  CELLS: {
    BANK_ACCOUNTS_CELL: "B2",
    INVESTMENTS_CELL: "B3",
    OWED_TO_US_CELL: "B6",
    PENSIONS_CELL: "B5",
    PROPERTY_CELL: "B4",
  } as const satisfies Record<string, string>,
  SHEET: { NAME: "Assets" },
} as const);

export const MetaBalanceSheet = defineSheetMeta({
  SHEET: { NAME: "Balance sheet" },
} as const);

// Split KEY_LABEL out so COLUMNS can be strictly numeric & branded
export const MetaBankAccounts = defineSheetMeta({
  COLUMNS: {
    BALANCE: oneBased(13), // Column M
    BALANCE_UPDATED: oneBased(19), // Column S
    CHECK_BALANCE_FREQUENCY: oneBased(12), // Column L
    DATE_CLOSED: oneBased(11), // Column K
    KEY: oneBased(1), // Column A
    OUR_MONEY: oneBased(38), // Column AL
    OWNER_CODE: oneBased(3), // Column C
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
} as const);

export const MetaBudget = defineSheetMeta({
  SHEET: { NAME: "Budget" },
} as const);

export const MetaBudgetAdHocTransactions = defineSheetMeta({
  SHEET: { NAME: "Budget ad hoc transactions" },
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    NOTE: oneBased(5),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(8),
  } as const satisfies Record<string, OneBased<number>>,
} as const);

export const MetaBudgetAnnualTransactions = defineSheetMeta({
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(5),
    PAYMENT_TYPE: oneBased(6),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget annual transactions" },
} as const);

export const MetaBudgetMonthlyTransactions = defineSheetMeta({
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(10),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget monthly transactions" },
} as const);

export const MetaBudgetPredictedSpend = defineSheetMeta({
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
} as const);

export const MetaBudgetWeeklyTransactions = defineSheetMeta({
  COLUMNS: {
    DATE: oneBased(1),
    DESCRIPTION: oneBased(2),
    DEBIT_AMOUNT: oneBased(4),
    FROM_ACCOUNT: oneBased(7),
    PAYMENT_TYPE: oneBased(16),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Budget weekly transactions" },
} as const);

export const MetaCategories = defineSheetMeta({
  SHEET: { NAME: "Categories" },
} as const);

export const MetaCategoryClash = defineSheetMeta({
  SHEET: { NAME: "Category clash" },
} as const);

export const MetaCheckFixedAmounts = defineSheetMeta({
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
} as const);

export const MetaDescriptionReplacements = defineSheetMeta({
  SHEET: { NAME: "Description replacements" },
} as const);

export const MetaHMRC_TaxReturn = defineSheetMeta({
  CELLS: {
    DATE_3: "B3:B3",
    MONEY_20: "C20:I26",
    MONEY_28: "C28:I36",
    MONEY_38: "C38:I41",
    MONEY_45: "C45:I49",
    MONEY_51: "C51:I58",
    MONEY_66: "C66:I67",
    MONEY_73: "C73:I73",
    DATE_78: "B78:B79",
    MONEY_81: "C81:I81",
    MONEY_114: "C114:I116",
    MONEY_118: "C118:I118",
    MONEY_127: "C127:I129",
    MONEY_134: "C134:I139",
    MONEY_141: "C141:I148",
    MONEY_150: "C150:I159",
    MONEY_176: "C176:I180",
    MONEY_183: "C183:I188",
    MONEY_202: "C202:I202",
    DATE_210: "C210:I210",
    MONEY_213: "C213:I215",
    MONEY_225: "C225:I225",
    MONEY_227: "C227:I228",
    MONEY_234: "C234:I234",
    MONEY_270: "C270:I270",
    MONEY_277: "C277:I278",
    MONEY_280: "C280:I289",
    MONEY_291: "C291:I291",
    MONEY_327: "C327:I327",
    MONEY_332: "C332:I332",
    MONEY_335: "C335:I337",
    DATE_382: "C382:I382",
    MONEY_384: "C384:I384",
    MONEY_386: "C386:I390",
    MONEY_446: "C446:I449",
  } as const satisfies Record<string, string>,
  COLUMNS: {
    QUESTIONS: oneBased(1),
    CATEGORY: oneBased(2),
    LATEST_TAX_YEAR: oneBased(3),
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "HMRC Tax return", HEADER_ROW: 1 },
} as const);

export const MetaMoneyOwedToUs = defineSheetMeta({
  COLUMNS: {
    OWED_TO_US_AMOUNT: oneBased(2), // Column B
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Money owed to us" },
} as const);

export const MetaNotInTransactionCategories = defineSheetMeta({
  SHEET: { NAME: "Not in transaction categories" },
} as const);

export const MetaOurMoney = defineSheetMeta({
  CELLS: {
    DATE_AS_AT: "A2",
    MONEY_TOTAL: "A5",
    MONEY_PENSION_FUNDS: "A8",
    MONEY_IN_THE_BANK: "A11",
  } as const satisfies Record<string, string>,
  SHEET: { NAME: "Our money" },
} as const);

export const MetaPensions = defineSheetMeta({
  COLUMNS: {
    PENSION_VALUE: oneBased(4), // Column D
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Pensions" },
} as const);

export const MetaProperty = defineSheetMeta({
  COLUMNS: {
    PROPERTY_VALUE: oneBased(3), // Column C
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Property" },
} as const);

export const MetaShares = defineSheetMeta({
  COLUMNS: {
    BALANCE: oneBased(6), // Column F
  } as const satisfies Record<string, OneBased<number>>,
  SHEET: { NAME: "Shares" },
} as const);

export const MetaSSACRD = defineSheetMeta({
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
} as const);

export const MetaTransactions = defineSheetMeta({
  SHEET: { NAME: "Transactions" },
} as const);

export const MetaTransactionCategories = defineSheetMeta({
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
} as const);

export const MetaTransactionsByDate = defineSheetMeta({
  SHEET: { NAME: "Transactions by date" },
} as const);

export const MetaUncategorisedByDate = defineSheetMeta({
  SHEET: { NAME: "Uncategorised by date" },
} as const);
