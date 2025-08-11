export function withReentrancy(key: string, ttlMs: number, fn: () => void) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const until = Number(props.getProperty(key) || 0);
  if (until && now < until) return; // skip re-entry
  props.setProperty(key, String(now + ttlMs));
  try { fn(); } finally { props.deleteProperty(key); }
}
