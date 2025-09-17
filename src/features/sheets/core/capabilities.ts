// src/sheets/core/capabilities.ts
export interface CanFixSheet {
  fixSheet(): void;
}
export interface CanFormatSheet {
  formatSheet(): void;
}
export interface CanTrimSheet {
  trimSheet(): void;
}

export interface CanUpdateAccountBalance {
  updateAccountBalance: (sheetName: string) => void;
}
