import { FastLog } from "@logging";
import { createMenu } from "./createMenu";
import {
  analyzeTransactionsMenuItems,
  budgetMenuItems,
  transactionsMenuItems,
} from "./menuItems";

export function buildSectionsMenu(ui: GoogleAppsScript.Base.Ui) {
  const startTime = FastLog.start(buildSectionsMenu.name);

  const analyzeTransactionsMenu = createMenu(
    ui,
    "Analyze transactions",
    analyzeTransactionsMenuItems
  );
  const transactionsMenu = createMenu(
    ui,
    "Transactions",
    transactionsMenuItems
  );
  const budgetMenu = createMenu(ui, "Budget", budgetMenuItems);

  ui.createMenu("Sections")
    .addSubMenu(analyzeTransactionsMenu)
    .addSeparator()
    .addSubMenu(transactionsMenu)
    .addSeparator()
    .addSubMenu(budgetMenu)
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
        .addItem("SES Childcare", "goToSheetHMRCTransactionsSummary")
        .addItem("SES Property management", "goToSheetHMRCTransactionsSummary")
        .addItem("Tax return", "goToSheetHMRC_TaxReturn")
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
