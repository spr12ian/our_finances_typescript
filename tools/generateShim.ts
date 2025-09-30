// scripts/generateShim.ts
import { FastLog } from "@logging/FastLog";
import fs from "fs";
import path from "path";
import { sheetNames } from "../src/constants/sheetNames";
import { shimGlobals } from "../src/shimGlobals";
import { getDirname } from "./esmPath";

const __dirname = getDirname(import.meta.url);
const shimFile = path.resolve(__dirname, "../build/shim.gs");

const makeFn = (name: string) =>
  `function ${name}(...args) { return globalThis.GAS_${name}(...args); }`;

const makeAccountFn = (name: string) =>
  `function goToSheetLastRow${name}(...args) { return globalThis.GAS_goToSheetLastRow${name}(...args); }`;

// filter only sheet names starting with "_"
const accountSheets = sheetNames.filter((name) => name.startsWith("_"));

const lines: string[] = [
  "// Auto-generated shim.gs — do not edit manually",
  "",
  "// ─── shimGlobals ────────────────────────────────────────────────",
  ...shimGlobals.map(makeFn),
  "",
  "// ─── accountSheets (names starting with _) ─────────────────────",
  ...accountSheets.map(makeAccountFn),
];

fs.writeFileSync(shimFile, lines.join("\n") + "\n", "utf8");

FastLog.log(
  `✅ Generated shim.gs with ${shimGlobals.length} shimGlobals and ${
    accountSheets.length
  } accountSheets (total ${shimGlobals.length + accountSheets.length})`
);
