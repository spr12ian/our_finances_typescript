import { OurFinances } from "./OurFinances";

export function GAS_applyDescriptionReplacements() {
  new OurFinances().applyDescriptionReplacements();
}

export function GAS_budget() {
  new OurFinances().goToSheet("Budget");
}

export function GAS_sendDailyEmail() {
  new OurFinances().sendDailyEmail();
}

export function GAS_sortSheets() {
  new OurFinances().sortSheets();
}
