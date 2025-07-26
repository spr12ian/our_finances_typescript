export const LOCALE = "en-GB" as const;

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
