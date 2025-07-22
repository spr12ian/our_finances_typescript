// scripts/generateShim.ts
import fs from "fs";
import path from "path";
import { shimGlobals } from "../src/shimGlobals";

const shimFile = path.resolve(__dirname, "../build/shim.gs");

const lines = [
  "// Auto-generated shim.gs — do not edit manually",
  ...shimGlobals.map(
    (name) => `function ${name}() { return globalThis.GAS_${name}(); }`
  ),
];

fs.writeFileSync(shimFile, lines.join("\n") + "\n", "utf8");
console.log(`✅ Generated shim.gs with ${shimGlobals.length} function(s)`);
