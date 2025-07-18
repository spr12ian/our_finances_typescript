import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  target: "es2015",
  format: ["cjs"], // VERY IMPORTANT: Avoid iife or esm for Apps Script
  treeshake: false,
  clean: true,
  shims: false, // no Node.js globals
  outExtension: () => ({ js: ".js" }),
});
