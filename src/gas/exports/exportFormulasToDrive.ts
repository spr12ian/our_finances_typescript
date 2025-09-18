// exportFormulasToDrive.ts

/**
 * Exports all formulas (as A1 or R1C1) from sheets whose name is > "BMONZO"
 * into a single TypeScript file on Drive: `FormulasExport.ts`.
 *
 * Produces:
 *   export interface FormulaEntry { cell: string; formula: string }
 *   export interface SheetFormulaExport { sheet: string; entries: FormulaEntry[] }
 *   const FORMULAS: SheetFormulaExport[] = [ ... ];
 *   export default FORMULAS;
 */

import { writeTextFileToDrive } from "@lib/google/drive";
import { columnNumberToLetter } from "@lib/number";
import { FastLog } from "@logging";

interface FormulaEntry {
  cell: string;
  formula: string;
}
interface SheetFormulaExport {
  sheet: string;
  entries: FormulaEntry[];
}

export function exportFormulasToDrive(): void {
  const fn = exportFormulasToDrive.name;
  const startTime = FastLog.start(fn);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter((s) => s.getName() > "BMONZO"); // lexical filter, intentional?
  const useR1C1 = false; // flip to true if you prefer R1C1 formulas

  const data: SheetFormulaExport[] = [];

  for (const sheet of sheets) {
    const { entries, name }: { entries: FormulaEntry[]; name: string } =
      getFormulasFromSheet(sheet, useR1C1);

    if (entries.length) {
      data.push({ sheet: name, entries });
      FastLog.log(`// ---- ${name} ---- (${entries.length} formulas)`);
    }
  }

  // Build a typed TS module using JSON.stringify for safe escaping
  const header =
    `// Generated on ${new Date().toISOString()}\n` +
    `export interface FormulaEntry { cell: string; formula: string }\n` +
    `export interface SheetFormulaExport { sheet: string; entries: FormulaEntry[] }\n` +
    `const FORMULAS: SheetFormulaExport[] = `;
  const body = JSON.stringify(data, null, 2);
  const footer = `;\nexport default FORMULAS;\n`;
  const contents = header + body + footer;

  writeTextFileToDrive("FormulasExport.ts", contents);

  FastLog.finish(fn, startTime);
}

function getFormulasFromSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  useR1C1: boolean
) {
  const fn = getFormulasFromSheet.name;
  const startTime = FastLog.start(fn);

  const name = sheet.getName();
  const range = sheet.getDataRange();
  const formulas = useR1C1 ? range.getFormulasR1C1() : range.getFormulas();

  const entries: FormulaEntry[] = [];
  for (let r = 0; r < formulas.length; r++) {
    const row = formulas[r];
    for (let c = 0; c < row.length; c++) {
      const f = row[c];
      if (f) {
        const cellA1 = `${columnNumberToLetter(c + 1)}${r + 1}`;
        entries.push({ cell: cellA1, formula: f });
      }
    }
  }
  FastLog.log(name, entries)
  FastLog.finish(fn,startTime);

  return { entries, name };
}
