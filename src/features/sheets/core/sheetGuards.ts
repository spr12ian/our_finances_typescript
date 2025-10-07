// src/sheets/core/sheetGuards.ts
import { makeMethodGuard } from "@lib/typeGuards";
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

export type { CanFixSheet, CanFormatSheet, CanTrimSheet } from "./capabilities";
