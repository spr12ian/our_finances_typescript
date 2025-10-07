import { isSheetConstructor } from "./isSheetConstructor";
import { addCommonMethods } from "./addCommonMethods";
import * as SheetClasses from "./classes";

Object.values(SheetClasses).forEach((sheetClass) => {
  if (isSheetConstructor(sheetClass)) addCommonMethods(sheetClass);
});
