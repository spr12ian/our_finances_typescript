// scripts/generateGasAccountFunctions.ts
import { FastLog } from "@logging/FastLog";
import fs from "fs";
import path from "path";
import { sheetNames } from "../src/constants/sheetNames";
import { getDirname } from "./esmPath";

const __dirname = getDirname(import.meta.url);
const gasAccountFunctions = path.resolve(__dirname, "../src/gas/exports/gasAccountFunctions.ts");

const makeAccountFn = (name: string) =>
  `export function GAS_goToSheetLastRow${name}() { goToSheetLastRow("${name}"); }`;

// filter only sheet names starting with "_"
const accountSheets = sheetNames.filter((name) => name.startsWith("_"));

const lines: string[] = [
  "// Auto-generated gasAccountFunctions.ts — do not edit manually",
  "import { goToSheetLastRow } from 'src/goToSheetLastRow';",
  "",
  "// ─── accountSheets (names starting with _) ─────────────────────",
  ...accountSheets.map(makeAccountFn),
];

fs.writeFileSync(gasAccountFunctions, lines.join("\n") + "\n", "utf8");

FastLog.log(
  `✅ Generated gasAccountFunctions.ts for ${accountSheets.length} accountSheets`
);
