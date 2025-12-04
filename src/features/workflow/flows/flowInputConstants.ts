// flowInputConstants.ts

export const FLOW_INPUT_DEFAULTS_REGISTRY = {
  accountSheetBalanceValuesFlow: {
    accountSheetName: "",
    startRow: 1,
  },
  fixSheetFlow: {
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
} satisfies {
  accountSheetBalanceValuesFlow: {
    accountSheetName: string,
    startRow: number,
  },
  fixSheetFlow: {
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
};
