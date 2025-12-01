// flowInputConstants.ts

export const FLOW_INPUT_DEFAULTS_REGISTRY = {
  accountSheetBalanceValuesFlow: {
    accountSheetName: "",
    startRow: 1,
    queuedBy: "",
  },
  fixSheetFlow: {
    sheetName: "",
    queuedBy: "",
  },
  sendMeHtmlEmailFlow: {
    htmlBody: "",
    queuedBy: "",
    subject: "",
  },
} satisfies {
  accountSheetBalanceValuesFlow: {
    accountSheetName: string,
    startRow: number,
    queuedBy: string,
  },
  fixSheetFlow: {
    sheetName: string,
    queuedBy: string,
  },
  sendMeHtmlEmailFlow: {
    htmlBody: string,
    queuedBy: string,
    subject: string,
  }
};
