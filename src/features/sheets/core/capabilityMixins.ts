// src/sheets/core/capabilityMixins.ts

export type SheetConstructor<T = {}> = abstract new (...args: any[]) => T;
