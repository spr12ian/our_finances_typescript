export function validateAllMenuFunctionNames() {
  const registered = new Set((globalThis as any).__exportedGlobals__ ?? []);
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
    Logger.log("⚠️ Menu builders not found on globalThis:");
    missingBuilders.forEach((b) => Logger.log(`- ${b}`));
  }

  if (missing.length === 0) {
    Logger.log(
      "✅ All menu function names used in builder functions are valid."
    );
  } else {
    Logger.log("❌ Missing function(s) referenced in menu builders:");
    missing.forEach((fn) => Logger.log(`- ${fn}`));
  }

  Logger.log("🧩 Used function names:");
  Logger.log([...usedFunctionNames].sort().join(", "));

  Logger.log("🧩 Registered functions:");
  Logger.log([...registered].sort().join(", "));
}
