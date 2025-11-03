// @workflow/engineState.ts

// Authoritative options type for the engine.
// Keep ISO strings here to match your queue layer.
export type EnqueueOptions = {
  runAt?: Date | null; // ISO 8601 or null/undefined
  priority?: number;
};

export type EnqueueFn = (
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

export function isEngineConfigured(): boolean {
  return !!enqueueRef;
}

// Optional: helps detect duplicate module instances at runtime
export const ENGINE_INSTANCE_ID = Utilities.getUuid();
