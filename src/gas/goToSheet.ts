  export function goToSheet(sheetName: string) {
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);

    // Check if the sheet exists before trying to activate it.
    if (sheet) {
      sheet.activate();
    }
  }
