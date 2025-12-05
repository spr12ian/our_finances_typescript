// flowInputConstants.ts

export const FLOW_INPUT_DEFAULTS_REGISTRY = {
  accountSheetBalanceValuesFlow: {
    accountSheetName: "",
    startRow: 1,
  },
  applyDescriptionReplacementsFlow: {
    accountSheetName: "",
  },
  fixSheetFlow: {
    sheetName: "",
  },
  formatSheetFlow: {
    sheetName: "",
  },
  sendMeHtmlEmailFlow: {
    htmlBody: "",
    subject: "",
  },
  templateFlow: {
    parameter1: "",
    parameter2: 0,
  },
  trimSheetFlow: {
    sheetName: "",
  },
  updateOpenBalancesFlow: {
  },
} satisfies {
  accountSheetBalanceValuesFlow: {
    accountSheetName: string,
    startRow: number,
  },
  applyDescriptionReplacementsFlow: {
    accountSheetName: string,
  },
  fixSheetFlow: {
    sheetName: string,
  },
  formatSheetFlow: {
    sheetName: string,
  },
  sendMeHtmlEmailFlow: {
    htmlBody: string,
    subject: string,
  },
  templateFlow: {
    parameter1: string,
    parameter2: number,
  },
  trimSheetFlow: {
    sheetName: string,
  },
  updateOpenBalancesFlow: {
  },
};
