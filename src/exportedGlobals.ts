// scripts/exportedGlobals.ts
export const exportedGlobals = [
  'myScheduledTask',
  'onDateChange',
  'onOpen',
] as const;

export type ExportedGlobal = (typeof exportedGlobals)[number];
