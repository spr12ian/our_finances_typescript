// src/sheets/core/capabilities.ts
export interface canFixSheet { fixSheet(): void }
export interface canFormatSheet { formatSheet(): void }
export interface canTrimSheet { trimSheet(): void }

export const hasFixSheet = (x: unknown): x is canFixSheet =>
  !!x && typeof (x as any).fixSheet === "function";
export const hasFormatSheet = (x: unknown): x is canFormatSheet =>
  !!x && typeof (x as any).formatSheet === "function";
export const hasTrimSheet = (x: unknown): x is canTrimSheet =>
  !!x && typeof (x as any).trimSheet === "function";
