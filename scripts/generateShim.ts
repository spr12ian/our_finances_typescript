// scripts/generateShim.ts
import fs from "fs";
import path from "path";
import { shimGlobals } from "../src/shimGlobals";
import { getDirname } from "./utils/esmPath";
import { FastLog } from '../src/FastLog';

const __dirname = getDirname(import.meta.url);

const shimFile = path.resolve(__dirname, "../build/shim.gs");

const lines = [
  "// Auto-generated shim.gs — do not edit manually",
  ...shimGlobals.map(
    (name) =>
      `function ${name}(...args) { return globalThis.GAS_${name}(...args); }`
  ),
];

fs.writeFileSync(shimFile, lines.join("\n") + "\n", "utf8");
FastLog.log(`✅ Generated shim.gs with ${shimGlobals.length} function(s)`);
