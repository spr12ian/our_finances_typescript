// renderUpcomingDebitsAsHtmlTable.ts

import type { UpcomingDebitRow } from "@sheets/budgetTypes";

export function renderUpcomingDebitsAsHtmlTable(
  rows: UpcomingDebitRow[]
): Html {
  if (rows.length === 0) return "";
  const esc = (s: string) =>
    String(s).replace(
      /[&<>"]/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!)
    );
  const th = (t: string, align: "left" | "right" = "left") =>
    `<th style="text-align:${align}; padding:2px 8px;">${esc(t)}</th>`;
  const td = (t: string, align: "left" | "right" = "left") =>
    `<td style="text-align:${align}; padding:2px 8px; white-space:nowrap;">${esc(
      t
    )}</td>`;

  return `
<table style="border-collapse:collapse;font-family:ui-monospace,Consolas,Menlo,monospace;">
  <thead>
    <tr>${th("Date")}${th("Amount", "right")}${th("From")}${th("By")}${th(
    "Description"
  )}</tr>
  </thead>
  <tbody>
    ${rows
      .map(
        (r) => `<tr>
      ${td(r.date)}${td(r.amount, "right")}${td(r.from)}${td(r.by)}${td(
          r.description
        )}
    </tr>`
      )
      .join("")}
  </tbody>
</table>`;
}
