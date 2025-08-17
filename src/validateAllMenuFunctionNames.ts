export function validateAllMenuFunctionNames() {
  const registered = new Set((globalThis as any).__exportedGlobals__ ?? []);

  // console.log("🧩 Registered functions:");
  // console.log([...registered].sort().join(", "));

  const knownMissing = ["onEdit", "doGet"];

  const builderFunctionNames = [
    "buildSectionsMenu_",
    "buildGasMenu_",
    "buildAccountsMenu_",
  ];

  const regex = /\.addItem\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']\s*\)/g;
  const usedFunctionNames = new Set<string>();
  const missingBuilders: string[] = [];

  for (const name of builderFunctionNames) {
    const fn = (globalThis as any)[name];
    if (typeof fn !== "function") {
      missingBuilders.push(name);
      continue;
    }

    const source = fn.toString();
    let match;
    while ((match = regex.exec(source)) !== null) {
      usedFunctionNames.add(match[1]);
    }
  }

  const missing = [...usedFunctionNames].filter(
    (fnName) => !registered.has(fnName) && !knownMissing.includes(fnName)
  );

  if (missingBuilders.length > 0) {
    console.log("⚠️ Menu builders not found on globalThis:");
    missingBuilders.forEach((b) => console.log(`- ${b}`));
  }

  if (missing.length === 0) {
    console.log(
      "✅ All menu function names used in builder functions are valid."
    );
  } else {
    console.log("❌ Missing function(s) referenced in menu builders:");
    missing.forEach((fn) => console.log(`- ${fn}`));
  }

  console.log("🧩 Used function names:");
  console.log([...usedFunctionNames].sort().join(", "));
}
