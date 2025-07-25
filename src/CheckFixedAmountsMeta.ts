export const CheckFixedAmountsMeta = {
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
