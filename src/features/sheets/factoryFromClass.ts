// factoryFromClass.ts
import type { Spreadsheet } from "@domain";
import type { Ctor, SheetFactory } from "./sheetFactoryTypes";

type FactoryWithBuild<T> = SheetFactory<T> & { build: SheetFactory<T> };

export function factoryFromClass<T>(Ctor: Ctor<T>): FactoryWithBuild<T> {
  const f: SheetFactory<T> = (s: Spreadsheet) => new Ctor(s);
  (f as FactoryWithBuild<T>).build = f;
  return f as FactoryWithBuild<T>;
}
