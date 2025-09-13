// src/workflow/workflowHandlers.ts (avoid importing queueFunctions to dodge cycles)
import { queueJob } from "../queueJob";
import {
  configureWorkflowEngine,
  JOB_RUN_STEP,
  runStep,
} from "../workflow/workflowEngine";
import { registerAllWorkflows } from "./registerAllWorkflows";

configureWorkflowEngine(queueJob);

// make sure registry exists before handlers are used
registerAllWorkflows();

export const jobHandlers: Record<string, (p: any) => any> = {};
jobHandlers[JOB_RUN_STEP] = (params) => {
  registerAllWorkflows(); // defensive (idempotent)
  return runStep(params);
};
