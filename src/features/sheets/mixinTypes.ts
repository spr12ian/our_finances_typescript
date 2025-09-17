import type { Spreadsheet } from '@domain';

export type SheetFactory<T = any> = (s: Spreadsheet) => T;
export type Ctor<T> = new (s: Spreadsheet) => T;

// A mixin that augments an instance and returns the same instance with extra methods
export type Mixin<T, U> = (obj: T) => T & U;
