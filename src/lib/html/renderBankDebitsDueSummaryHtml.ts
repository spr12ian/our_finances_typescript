import type { BankDebitDueRow } from "@sheets/budgetTypes";

export function renderBankDebitsDueSummaryHtml(rows: BankDebitDueRow[]): Html {
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
    <tr>${th("Account")}${th("Amount", "right")}</tr>
  </thead>
  <tbody>
    ${rows
      .map(
        (r) => `<tr>
      ${td(r.account)}${td(r.amount, "right")}
    </tr>`
      )
      .join("")}
  </tbody>
</table>`;
}
