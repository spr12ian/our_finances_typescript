// SheetFactoryTypes.ts

import type { Spreadsheet } from "@domain";

export type SheetFactory<T = any> = (s: Spreadsheet) => T;
export type Ctor<T> = new (s: Spreadsheet) => T;
