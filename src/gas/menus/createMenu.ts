import { FastLog } from "@logging";

export function createMenu(
  ui: GoogleAppsScript.Base.Ui,
  menuCaption: string,
  menuItemArray: [string, string][]
): GoogleAppsScript.Base.Menu {
  const startTime = FastLog.start(createMenu.name);

  const menu = ui.createMenu(menuCaption);

  menuItemArray.forEach(([itemName, itemFunction]) => {
    menu.addItem(itemName, itemFunction);
  });

  //menu.addToUi();

  FastLog.finish(createMenu.name, startTime);

  return menu;
}
