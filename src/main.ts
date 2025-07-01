/// <reference types="google-apps-script" />

// Main program starts here

const locale = "en-GB";

const activeSpreadsheet = new Spreadsheet();

const gasSpreadsheetApp = SpreadsheetApp;

const accountSheetNames = getSheetNamesByType("account");
const dynamicFunctions = accountSheetNames.reduce((acc, sheetName) => {
  const funName = `dynamicAccount${sheetName}`;
  acc[funName] = () => goToSheetLastRow(sheetName);
  return acc;
}, {});

Object.assign(this, dynamicFunctions);
