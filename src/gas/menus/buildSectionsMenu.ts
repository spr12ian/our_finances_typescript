import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "../../lib/constants";
import { FastLog } from "../../lib/logging/FastLog";

export function buildSectionsMenu(ui: GoogleAppsScript.Base.Ui) {
  const startTime = FastLog.start(buildSectionsMenu.name);
  ui.createMenu("Sections")
    .addSubMenu(
      ui
        .createMenu("Accounts")
        .addItem("Update balance values", "updateBalanceValues")
        .addItem(
          "Not in transaction categories",
          "goToSheetNotInTransactionCategories"
        )
        .addItem("Uncategorised by date", "goToSheetUncategorisedByDate")
        .addItem("Category clash", "goToSheetCategoryClash")
        .addItem("Categories", "goToSheetCategories")
        .addItem("Transactions by date", "goToSheetTransactionsByDate")
        .addItem("Transaction categories", "goToSheetTransactionCategories")
        .addItem("Format account sheet", "formatAccountSheet")
        .addItem("Update 'Transactions'", "updateTransactions")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Budget")
        .addItem("Budget", "budget")
        .addItem(
          MetaBudgetAnnualTransactions.SHEET.NAME,
          "budgetAnnualTransactions"
        )
        .addItem("Budget monthly transactions", "budgetMonthlyTransactions")
        .addItem(
          MetaBudgetAdHocTransactions.SHEET.NAME,
          "budgetAdHocTransactions"
        )
        .addItem("Budget predicted spend", "budgetPredictedSpend")
        .addItem("Budget weekly transactions", "budgetWeeklyTransactions")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Charlie")
        .addItem("Charlie's transactions", "goToSheet_CVITRA")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Fownes Street")
        .addItem("Fownes Street Halifax account", "goToSheet_AHALIF")
        .addItem("Fownes Street Ian B HMRC records", "goToSheet_SVI2TJ")
        .addItem("Fownes Street IRF transactions", "goToSheet_SVIIRF")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Glenburnie")
        .addItem("Glenburnie investment loan", "goToSheet_SVIGBL")
        .addItem("Glenburnie loan", "goToSheetLoanGlenburnie")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("HMRC")
        .addItem(
          "HMRC Transactions summary",
          "goToSheetHMRCTransactionsSummary"
        )
        .addItem("Self Assessment Ian Bernard", "goToSheetHMRC_B")
        .addItem("Self Assessment Ian Sweeney", "goToSheetHMRC_S")
        .addItem("SES Childcare", "goToSheetHMRCTransactionsSummary")
        .addItem("SES Property management", "goToSheetHMRCTransactionsSummary")
        .addItem("TR People", "goToSheetPeople")
        .addItem("UKP Fownes Street", "goToSheetHMRCTransactionsSummary")
        .addItem("UKP One Park West", "goToSheetHMRCTransactionsSummary")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("SW18 3PT")
        .addItem("Home Assistant inventory", "goToSheetSW183PTInventory")
        .addItem("Inventory", "goToSheetSW183PTInventory")
    )
    .addSeparator()
    .addItem("Xfers mismatch", "goToSheetXfersMismatch")
    .addToUi();

  FastLog.finish(buildSectionsMenu.name, startTime);
}
