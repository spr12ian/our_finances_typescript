// scripts/generateShim.ts
import fs from "fs";
import path from "path";
import { exportedGlobals } from "../src/exportedGlobals";

const shimFile = path.resolve(__dirname, "../build/shim.gs");

const lines = [
  "// Auto-generated shim.gs — do not edit manually",
  ...exportedGlobals.map(
    (name) => `function ${name}() { return globalThis.${name}(); }`
  ),
];

fs.writeFileSync(shimFile, lines.join("\n") + "\n", "utf8");
console.log(`✅ Generated shim.gs with ${exportedGlobals.length} function(s)`);
