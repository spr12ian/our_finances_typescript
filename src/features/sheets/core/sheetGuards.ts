// src/sheets/core/sheetGuards.ts
import { makeAllMethodsGuard, makeMethodGuard } from "@lib/typeGuards";
import type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";

export const hasFixSheet = makeMethodGuard<"fixSheet", CanFixSheet["fixSheet"]>(
  "fixSheet"
);
export const hasTrimSheet = makeMethodGuard<
  "trimSheet",
  CanTrimSheet["trimSheet"]
>("trimSheet");
export const hasFormatSheet = makeMethodGuard<
  "formatSheet",
  CanFormatSheet["formatSheet"]
>("formatSheet");

// Combinations
export const hasFixAndTrim = makeAllMethodsGuard("fixSheet", "trimSheet");
export const hasFixTrimFormat = makeAllMethodsGuard(
  "fixSheet",
  "trimSheet",
  "formatSheet"
);

export type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";
