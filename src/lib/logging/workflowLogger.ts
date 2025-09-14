// src/workflow/logging.ts
export interface StepLogger {
  (msg: string, ...args: any[]): void; // callable
  error: (err: unknown, ...args: any[]) => void; // properties
  start: (fn: string, ...args: any[]) => Date;
  finish: (fn: string, startTime: Date) => void;
}
