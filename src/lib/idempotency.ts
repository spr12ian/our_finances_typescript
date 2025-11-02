// idempotency.ts
export function idempotencyKey(
  workflowName: string,
  stepName: string,
  sheet: string
) {
  return `q:idem:${workflowName}:${stepName}:${sheet}`;
}
