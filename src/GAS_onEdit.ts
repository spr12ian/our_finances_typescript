import { Trigger } from "./Trigger";

export function xGAS_onEdit(event: GoogleAppsScript.Events.SheetsOnEdit) {
  const trigger = new Trigger(event);
  const sheet = trigger.getSheet();
  const sheetName = trigger.getSheetName();

  if (sheetName == HMRC_S.SHEET.NAME) {
    const hmrcS = new HMRC_S();
    hmrcS.handleEdit(trigger);
  }

  const bankAccounts = new BankAccounts();
  bankAccounts.updateLastUpdatedBySheet(sheet);
}
