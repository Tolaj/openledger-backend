import { getTemplateStyles } from "./templateStyles.js";

export const renderGOHtml = (go, group) => {
    const fmt = (n) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);

    const rows = (go.items || [])
        .map(
            (it, i) => `
        <tr class="${i % 2 === 0 ? "even" : ""}">
            <td>${it.product?.name || it.description || "—"}</td>
            <td class="center">${it.qty ?? "—"} ${it.unit || ""}</td>
            <td class="right">${fmt(it.unitPrice)}</td>
            <td class="center">${it.taxRate ?? 0}%</td>
            <td class="right">${fmt(it.amount)}</td>
        </tr>`
        )
        .join("");

    const orderDate = go.orderDate
        ? new Date(go.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const createdDate = new Date(go.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });

    const isPayable = go.direction === "payable";
    const partyLabel = isPayable ? "To (Recipient)" : "From (Recipient)";

    const tmpl = group?.businessDetails?.template || "classic";
    const needsBody = tmpl === "modern" || tmpl === "executive";
    const modern = tmpl === "modern";
    const bodyOpen = needsBody ? '<div class="body">' : "";
    const bodyClose = needsBody ? "</div>" : "";
    const divider = needsBody ? "" : '<div class="divider"></div>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${getTemplateStyles(tmpl, group?.businessDetails?.color)}
  .dir-badge { display: inline-block; margin-top: 4px; background: ${isPayable ? "#fef3c7" : "#dbeafe"}; color: ${isPayable ? "#92400e" : "#1e40af"}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }</style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div class="brand">
      ${group?.businessDetails?.logo ? `<img src="${group.businessDetails.logo}" style="max-height:48px;max-width:120px;object-fit:contain;margin-bottom:4px;" />` : ""}
      ${group?.businessDetails?.legalName || group?.name || "OpenLedger"}
      <span>General Order</span>
    </div>
    <div class="doc-meta">
      <div class="doc-number">${go.goNumber}</div>
      <div class="doc-date">Issued ${createdDate}</div>
      <span class="dir-badge">${go.direction || "payable"}</span>
      <br/>
      <span class="status-badge">${go.status || "draft"}</span>
    </div>
  </div>

  ${bodyOpen}
  ${divider}

  <div class="parties">
    <div class="party-card">
      <div class="party-label">From</div>
      <div class="party-name">${group?.businessDetails?.legalName || group?.name || "—"}</div>
      ${group?.businessDetails?.gstin ? `<div class="party-detail">GSTIN: ${group.businessDetails.gstin}</div>` : ""}
      ${group?.businessDetails?.email || group?.email ? `<div class="party-detail">${group?.businessDetails?.email || group.email}</div>` : ""}
      ${group?.businessDetails?.phone ? `<div class="party-detail">${group.businessDetails.phone}</div>` : ""}
      ${group?.businessDetails?.addressLine1 ? `<div class="party-detail">${[group.businessDetails.addressLine1, group.businessDetails.city, group.businessDetails.state, group.businessDetails.pincode].filter(Boolean).join(", ")}</div>` : (group?.address ? `<div class="party-detail">${group.address}</div>` : "")}
    </div>
    <div class="party-card">
      <div class="party-label">${partyLabel}</div>
      <div class="party-name">${go.recipient?.name || "—"}</div>
      ${go.recipient?.email ? `<div class="party-detail">${go.recipient.email}</div>` : ""}
      ${go.recipient?.phone ? `<div class="party-detail">${go.recipient.phone}</div>` : ""}
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <div class="date-label">Created</div>
      <div class="date-value">${createdDate}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Order Date</div>
      <div class="date-value">${orderDate}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Direction</div>
      <div class="date-value">${isPayable ? "Payable (We Pay)" : "Receivable (We Receive)"}</div>
    </div>
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
      <div class="totals-row"><span>Subtotal</span><span>${fmt(go.subtotal)}</span></div>
      <div class="totals-row"><span>Tax</span><span>${fmt(go.taxAmount)}</span></div>
      <div class="totals-row grand"><span>Grand Total</span><span>${fmt(go.grandTotal)}</span></div>
    </div>
  </div>

  ${go.notes ? `
  <div class="notes-section">
    <div class="notes-label">Notes</div>
    <div class="notes-text">${go.notes}</div>
  </div>` : ""}

  <div class="footer">
    <span class="footer-note">Generated by OpenLedger · ${new Date().toLocaleDateString("en-IN")}</span>
    <span class="footer-note">This is a computer-generated document.</span>
  </div>

  ${bodyClose}
</div>
</body>
</html>`;
};
