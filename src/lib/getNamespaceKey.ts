// @lib/getNamespaceKey.ts
// Used to prevent re-entrant calls within the same execution context.

export function getNamespaceKey(nsName: string, key: string): string {
  return `${nsName}:${Session.getActiveUser().getEmail()}:${key}`;
}
