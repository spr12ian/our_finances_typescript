// @workflow/setupWorkflowsOnce.ts

import { setupWorkflows } from './setupWorkflows';

// module scope
let workflowsReady = false;

export function setupWorkflowsOnce() {
  if (!workflowsReady) {
    setupWorkflows();
    workflowsReady = true;
  }
}
