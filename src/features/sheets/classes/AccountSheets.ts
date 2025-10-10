import type { Sheet, Spreadsheet } from "@domain";
import { ACCOUNT_PREFIX } from "@lib/index";

export class AccountSheets {
  #accountSheets: Sheet[] | null = null;
  #accountSheetKeys: string[] | null = null;
  #accountSheetNames: string[] | null = null;
  constructor(private readonly spreadsheet: Spreadsheet) {}

  get accountSheets(): Sheet[] {
    if (this.#accountSheets === null) {
      this.#accountSheets = this.spreadsheet.sheets.filter((sheet) =>
        sheet.name.startsWith(ACCOUNT_PREFIX)
      );
    }

    return this.#accountSheets;
  }

  get accountSheetKeys(): string[] {
    if (this.#accountSheetKeys === null) {
      this.#accountSheetKeys = this.accountSheetNames.map((name) => name.slice(1));
    }

    return this.#accountSheetKeys;
  }

  get accountSheetNames(): string[] {
    if (this.#accountSheetNames === null) {
      this.#accountSheetNames = this.accountSheets.map((sheet) => sheet.name);
    }

    return this.#accountSheetNames;
  }

  forceRefresh(): void {
    this.#accountSheets = null;
    this.#accountSheetKeys = null;
  }
}
