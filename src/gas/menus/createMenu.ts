import { FastLog, functionStart } from "@logging";

export function createMenu(
  ui: GoogleAppsScript.Base.Ui,
  menuCaption: string,
  menuItemArray: [string, string][]
): GoogleAppsScript.Base.Menu {
  const finish = functionStart(createMenu.name);
  FastLog.log(`Creating menu: ${menuCaption} with ${menuItemArray.length} items`);

  const menu = ui.createMenu(menuCaption);

  menuItemArray.forEach(([itemName, itemFunction]) => {
    menu.addItem(itemName, itemFunction);
  });

  //menu.addToUi();

  finish();

  return menu;
}
