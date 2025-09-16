// @workflow/engineState.ts

// If you prefer, you can import JobName from your queue types:
import type { JobName } from "@queue/queueTypes";

// Unify the job name type so RUN_STEP is always allowed.
export type InfraJobName = JobName | "RUN_STEP";

// Authoritative options type for the engine.
// Keep ISO strings here to match your queue layer.
export type EnqueueOptions = {
  runAt?: string | null; // ISO 8601 or null/undefined
  priority?: number;
};

export type EnqueueFn = (
  jobName: InfraJobName,
  parameters: unknown,
  options?: EnqueueOptions
) => { id: string; row: number };

let enqueueRef: EnqueueFn | null = null;

export function setEnqueue(fn: EnqueueFn): void {
  enqueueRef = fn;
}

export function getEnqueue(): EnqueueFn {
  if (!enqueueRef) {
    throw new Error(
      "Workflow engine not configured: enqueue function not set. Call configureWorkflowEngine(queueJob) at startup."
    );
  }
  return enqueueRef;
}

export function isConfigured(): boolean {
  return !!enqueueRef;
}

// Optional: helps detect duplicate module instances at runtime
export const ENGINE_INSTANCE_ID = Utilities.getUuid();
