export function intersectsWatchedCols(
  r: GoogleAppsScript.Spreadsheet.Range,
  watched: Set<number>
): boolean {
  const start = r.getColumn();
  const end = start + r.getNumColumns() - 1;
  for (let c = start; c <= end; c++) if (watched.has(c)) return true;
  return false;
}
