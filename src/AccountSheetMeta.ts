// AccountSheetMeta.ts
export const AccountSheetMeta = {
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
