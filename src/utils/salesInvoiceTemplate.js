export const renderSalesInvoiceHtml = (inv, group) => {
    const fmt = (n) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: inv.customer?.currency || "INR" }).format(n || 0);

    const rows = (inv.items || [])
        .map((it, i) => `
        <tr class="${i % 2 === 0 ? "even" : ""}">
            <td>${it.product?.name || it.description || "—"}</td>
            <td class="center">${it.qty ?? "—"} ${it.unit || ""}</td>
            <td class="right">${fmt(it.unitPrice)}</td>
            <td class="center">${it.taxRate ?? 0}%</td>
            <td class="right">${fmt(it.amount)}</td>
        </tr>`).join("");

    const invoiceDate = inv.invoiceDate
        ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const dueDate = inv.dueDate
        ? new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const statusColor = inv.status === "paid" ? "#16a34a" : inv.status === "overdue" ? "#dc2626" : "#52525b";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #18181b; background: #fff; }
  .page { padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.5px; }
  .brand span { display: block; font-size: 11px; font-weight: 500; color: #71717a; letter-spacing: 0; margin-top: 2px; }
  .inv-meta { text-align: right; }
  .inv-number { font-size: 20px; font-weight: 700; color: #09090b; font-variant-numeric: tabular-nums; }
  .inv-date { font-size: 11px; color: #71717a; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: #f4f4f5; color: ${statusColor}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }
  .divider { height: 1px; background: #e4e4e7; margin-bottom: 28px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .party-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px; }
  .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 600; color: #09090b; margin-bottom: 4px; }
  .party-detail { font-size: 12px; color: #52525b; line-height: 1.6; }
  .dates { display: flex; gap: 24px; margin-bottom: 28px; }
  .date-item { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px 16px; }
  .date-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 4px; }
  .date-value { font-size: 13px; font-weight: 600; color: #09090b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #09090b; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f4f4f5; }
  tbody tr.even { background: #fafafa; }
  tbody td { padding: 10px 12px; font-size: 13px; color: #3f3f46; }
  tbody td.center { text-align: center; }
  tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #52525b; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: #09090b; border-bottom: none; padding-top: 10px; }
  .notes-section { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px; margin-bottom: 32px; }
  .notes-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 6px; }
  .notes-text { font-size: 13px; color: #52525b; line-height: 1.6; }
  .footer { border-top: 1px solid #e4e4e7; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer-note { font-size: 11px; color: #a1a1aa; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      ${group?.name || "OpenLedger"}
      <span>Sales Invoice</span>
    </div>
    <div class="inv-meta">
      <div class="inv-number">${inv.invoiceNumber}</div>
      <div class="inv-date">Issued ${invoiceDate}</div>
      <span class="status-badge">${inv.status || "draft"}</span>
    </div>
  </div>
  <div class="divider"></div>
  <div class="parties">
    <div class="party-card">
      <div class="party-label">From</div>
      <div class="party-name">${group?.name || "—"}</div>
      ${group?.email ? `<div class="party-detail">${group.email}</div>` : ""}
      ${group?.address ? `<div class="party-detail">${group.address}</div>` : ""}
    </div>
    <div class="party-card">
      <div class="party-label">Bill To (Customer)</div>
      <div class="party-name">${inv.customer?.name || "—"}</div>
      ${inv.customer?.email ? `<div class="party-detail">${inv.customer.email}</div>` : ""}
      ${inv.customer?.phone ? `<div class="party-detail">${inv.customer.phone}</div>` : ""}
      ${inv.customer?.address ? `<div class="party-detail">${inv.customer.address}</div>` : ""}
    </div>
  </div>
  <div class="dates">
    <div class="date-item">
      <div class="date-label">Invoice Date</div>
      <div class="date-value">${invoiceDate}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Due Date</div>
      <div class="date-value">${dueDate}</div>
    </div>
    ${inv.salesOrder?.soNumber ? `<div class="date-item"><div class="date-label">Sales Order</div><div class="date-value">${inv.salesOrder.soNumber}</div></div>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>Product / Description</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="center">Tax</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
      <div class="totals-row"><span>Tax</span><span>${fmt(inv.taxAmount)}</span></div>
      <div class="totals-row grand"><span>Grand Total</span><span>${fmt(inv.grandTotal)}</span></div>
    </div>
  </div>
  ${inv.notes ? `<div class="notes-section"><div class="notes-label">Notes</div><div class="notes-text">${inv.notes}</div></div>` : ""}
  <div class="footer">
    <span class="footer-note">Generated by OpenLedger · ${new Date().toLocaleDateString("en-IN")}</span>
    <span class="footer-note">This is a computer-generated document.</span>
  </div>
</div>
</body>
</html>`;
};
