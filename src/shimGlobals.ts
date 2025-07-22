export const shimGlobals = [
  "myScheduledTask",
  "onDateChange",
  "onOpen",
] as const;

export type ExportedGlobal = (typeof shimGlobals)[number];
