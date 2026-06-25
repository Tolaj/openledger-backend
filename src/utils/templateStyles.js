export const COLOR_THEMES = {
    forest: { accent: "#14532d", mid: "#166534", light: "#f0fdf4", border: "#bbf7d0", badge: "#dcfce7", badgeText: "#166534" },
    rose:   { accent: "#be123c", mid: "#e11d48", light: "#fff1f2", border: "#fecdd3", badge: "#ffe4e6", badgeText: "#be123c" },
    indigo: { accent: "#4338ca", mid: "#4f46e5", light: "#eef2ff", border: "#c7d2fe", badge: "#e0e7ff", badgeText: "#3730a3" },
    amber:  { accent: "#b45309", mid: "#d97706", light: "#fffbeb", border: "#fde68a", badge: "#fef3c7", badgeText: "#92400e" },
    teal:   { accent: "#0f766e", mid: "#0d9488", light: "#f0fdfa", border: "#99f6e4", badge: "#ccfbf1", badgeText: "#0f766e" },
    purple: { accent: "#6d28d9", mid: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe", badge: "#ede9fe", badgeText: "#5b21b6" },
    slate:  { accent: "#1e293b", mid: "#334155", light: "#f8fafc", border: "#cbd5e1", badge: "#f1f5f9", badgeText: "#334155" },
};

export const getTemplateStyles = (template = "classic", colorKey = "forest") => {
    const t = template || "classic";
    const c = COLOR_THEMES[colorKey] || COLOR_THEMES.forest;

    const base = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; color: #18181b; background: #fff; }
  .center { text-align: center; }
  .right { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  tbody td { padding: 10px 12px; font-size: 13px; }
  tbody td.center { text-align: center; }
  tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
  .notes-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .notes-text { font-size: 13px; line-height: 1.6; }
  .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 600; color: #09090b; margin-bottom: 4px; }
  .party-detail { font-size: 12px; color: #52525b; line-height: 1.6; }
  .date-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .date-value { font-size: 13px; font-weight: 600; color: #09090b; }
  .footer-note { font-size: 11px; color: #a1a1aa; }
  .brand > div { display: flex; flex-direction: column; }`;

    // ── Modern ────────────────────────────────────────────────────────────────────
    if (t === "modern") return base + `
  .page { padding: 40px 40px 40px 36px; border-left: 5px solid ${c.mid}; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { font-size: 18px; font-weight: 700; color: #09090b; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: #a1a1aa; margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 32px; font-weight: 700; color: ${c.mid}; letter-spacing: -1.5px; line-height: 1; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #a1a1aa; margin-top: 8px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 4px; }
  .divider { height: 1px; background: #f4f4f5; margin-bottom: 32px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .party-card { padding-left: 14px; border-left: 2px solid ${c.border}; }
  .party-label { color: ${c.mid}; }
  .dates { display: flex; gap: 32px; margin-bottom: 28px; }
  .date-item { padding-left: 14px; border-left: 2px solid ${c.border}; }
  .date-label { color: ${c.mid}; }
  thead tr { background: transparent; border-bottom: 2px solid #09090b; }
  thead th { color: #09090b; }
  tbody tr { border-bottom: 1px solid #f4f4f5; }
  tbody td { color: #3f3f46; }
  .totals-row { color: #71717a; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: ${c.mid}; border-bottom: none; border-top: 2px solid #09090b; padding-top: 10px; }
  .notes-section { border-left: 2px solid ${c.border}; padding-left: 16px; margin-bottom: 28px; }
  .notes-label { color: ${c.mid}; }
  .notes-text { color: #52525b; }
  .footer { border-top: 1px solid #f4f4f5; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Minimal ───────────────────────────────────────────────────────────────────
    if (t === "minimal") return base + `
  .page { padding: 48px; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 18px; font-weight: 600; color: #09090b; letter-spacing: -0.3px; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: #a1a1aa; letter-spacing: 0; margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 24px; font-weight: 300; color: #09090b; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #a1a1aa; margin-top: 6px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 100px; }
  .divider { height: 1px; background: #f4f4f5; margin-bottom: 36px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .party-card { padding: 0; }
  .party-label { color: #a1a1aa; }
  .dates { display: flex; gap: 32px; margin-bottom: 32px; }
  .date-item { padding: 0; }
  .date-label { color: #a1a1aa; }
  thead tr { background: transparent; border-bottom: 2px solid #09090b; }
  thead th { color: #09090b; padding: 8px 12px; }
  tbody tr { border-bottom: 1px solid #f4f4f5; }
  tbody td { color: #3f3f46; }
  .totals-row { color: #71717a; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 600; color: ${c.accent}; border-bottom: none; border-top: 1px solid #e4e4e7; padding-top: 12px; }
  .notes-section { padding: 0; margin-bottom: 28px; }
  .notes-label { color: #a1a1aa; }
  .notes-text { color: #52525b; }
  .footer { border-top: 1px solid #f4f4f5; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Executive: full-bleed accent header, themed accent cards ─────────────────
    if (t === "executive") return base + `
  .page { padding: 0; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px; background: ${c.accent}; }
  .brand { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.55); margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 24px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: rgba(255,255,255,0.18); color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }
  .body { padding: 32px 40px 40px; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .party-card { background: ${c.light}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px; }
  .party-label { color: ${c.mid}; }
  .dates { display: flex; gap: 16px; margin-bottom: 28px; }
  .date-item { padding: 10px 14px; background: ${c.light}; border: 1px solid ${c.border}; border-radius: 6px; }
  .date-label { color: ${c.mid}; }
  thead tr { background: ${c.accent}; color: #fff; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: #f9fafb; }
  tbody td { color: #374151; }
  .totals-row { color: #6b7280; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: ${c.accent}; border-top: 2px solid ${c.border}; border-bottom: none; padding-top: 10px; }
  .notes-section { background: ${c.light}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
  .notes-label { color: ${c.mid}; }
  .notes-text { color: #4b5563; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Bold: strong typographic header with thick accent underline ───────────────
    if (t === "bold") return base + `
  .page { padding: 48px; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 20px; border-bottom: 5px solid ${c.accent}; margin-bottom: 32px; }
  .brand { font-size: 28px; font-weight: 800; color: ${c.accent}; letter-spacing: -1.5px; }
  .brand span { display: block; font-size: 11px; font-weight: 600; color: #a1a1aa; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 28px; font-weight: 800; color: ${c.accent}; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #a1a1aa; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .party-card { padding: 14px 16px; border-left: 4px solid ${c.accent}; background: ${c.light}; }
  .party-label { color: ${c.mid}; }
  .dates { display: flex; gap: 20px; margin-bottom: 28px; }
  .date-item { padding: 10px 14px; border-left: 4px solid ${c.border}; }
  .date-label { color: #71717a; }
  thead tr { background: ${c.accent}; color: #fff; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: ${c.light}; }
  tbody td { color: #374151; }
  .totals-row { color: #6b7280; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 800; color: ${c.accent}; border-top: 5px solid ${c.accent}; border-bottom: none; padding-top: 10px; }
  .notes-section { padding: 14px 16px; border-left: 4px solid ${c.accent}; background: ${c.light}; margin-bottom: 32px; }
  .notes-label { color: ${c.mid}; }
  .notes-text { color: #4b5563; }
  .footer { border-top: 5px solid ${c.accent}; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Elegant: warm cream page, thin refined borders, generous whitespace ───────
    if (t === "elegant") return base + `
  body { background: #fdfaf5; }
  .page { padding: 52px; background: #fdfaf5; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #d6cfc4; }
  .brand { font-size: 20px; font-weight: 600; color: #1c1917; letter-spacing: -0.3px; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: #78716c; margin-top: 3px; letter-spacing: 0.04em; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 22px; font-weight: 600; color: ${c.accent}; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
  .doc-date { font-size: 11px; color: #78716c; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 100px; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
  .party-card { padding: 16px 18px; background: #fff; border: 1px solid #e7e0d5; border-radius: 6px; }
  .party-label { color: #78716c; }
  .dates { display: flex; gap: 20px; margin-bottom: 28px; }
  .date-item { padding: 10px 14px; background: #fff; border: 1px solid #e7e0d5; border-radius: 6px; }
  .date-label { color: #78716c; }
  thead tr { background: #f5ede0; border-bottom: 1px solid #d6cfc4; }
  thead th { color: #44403c; }
  tbody tr { border-bottom: 1px solid #ede8e0; }
  tbody tr.even { background: #faf7f2; }
  tbody td { color: #44403c; }
  .totals-row { color: #78716c; border-bottom: 1px solid #ede8e0; }
  .totals-row.grand { font-size: 15px; font-weight: 600; color: ${c.accent}; border-top: 1px solid #d6cfc4; border-bottom: none; padding-top: 12px; }
  .notes-section { background: #fff; border: 1px solid #e7e0d5; border-radius: 6px; padding: 16px 18px; margin-bottom: 32px; }
  .notes-label { color: #78716c; }
  .notes-text { color: #57534e; }
  .footer { border-top: 1px solid #d6cfc4; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer-note { color: #a8a29e; }`;

    // ── Retro: monospace font, dashed borders, vintage feel ───────────────────────
    if (t === "retro") return base + `
  body { font-family: "Courier New", Courier, monospace; background: #fefce8; }
  .page { padding: 40px; background: #fefce8; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0; padding-bottom: 16px; border-bottom: 2px dashed #a16207; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 700; color: #1c1917; letter-spacing: 0; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: #78716c; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.1em; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 20px; font-weight: 700; color: ${c.accent}; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #78716c; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: transparent; color: ${c.accent}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 6px; border: 2px dashed ${c.accent}; border-radius: 0; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .party-card { padding: 14px; background: #fff; border: 2px dashed #d6d3d1; }
  .party-label { color: #a16207; text-decoration: underline; text-underline-offset: 3px; }
  .dates { display: flex; gap: 16px; margin-bottom: 24px; }
  .date-item { padding: 10px 12px; background: #fff; border: 2px dashed #d6d3d1; }
  .date-label { color: #a16207; }
  thead tr { background: #1c1917; color: #fefce8; }
  thead th { letter-spacing: 0.1em; }
  tbody tr { border-bottom: 1px dashed #d6d3d1; }
  tbody tr.even { background: #fef9c3; }
  tbody td { color: #292524; }
  .totals-row { color: #78716c; border-bottom: 1px dashed #d6d3d1; }
  .totals-row.grand { font-size: 14px; font-weight: 700; color: ${c.accent}; border-top: 2px dashed #a16207; border-bottom: none; padding-top: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  .notes-section { background: #fff; border: 2px dashed #d6d3d1; padding: 14px; margin-bottom: 28px; }
  .notes-label { color: #a16207; text-decoration: underline; text-underline-offset: 3px; }
  .notes-text { color: #44403c; }
  .footer { border-top: 2px dashed #a16207; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
  .footer-note { color: #a8a29e; font-size: 10px; }`;

    // ── Compact: tight padding, dense information, suited for data-heavy docs ─────
    if (t === "compact") return base + `
  body { font-size: 11px; }
  .page { padding: 28px; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 16px; font-weight: 700; color: ${c.accent}; letter-spacing: -0.3px; }
  .brand span { display: block; font-size: 10px; font-weight: 400; color: #9ca3af; margin-top: 1px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 16px; font-weight: 700; color: ${c.accent}; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  .status-badge { display: inline-block; margin-top: 3px; background: ${c.badge}; color: ${c.badgeText}; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 3px; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .party-card { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 4px; }
  .party-label { font-size: 9px; margin-bottom: 4px; color: #9ca3af; }
  .party-name { font-size: 12px; margin-bottom: 2px; }
  .party-detail { font-size: 10px; }
  .dates { display: flex; gap: 10px; margin-bottom: 14px; }
  .date-item { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 4px; }
  .date-label { font-size: 9px; margin-bottom: 2px; color: #9ca3af; }
  .date-value { font-size: 11px; }
  thead th { padding: 7px 10px; font-size: 9px; background: ${c.accent}; color: #fff; }
  tbody td { padding: 7px 10px; font-size: 11px; color: #374151; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: #f9fafb; }
  .totals { margin-bottom: 16px; }
  .totals-box { width: 220px; }
  .totals-row { padding: 4px 0; font-size: 11px; color: #6b7280; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 13px; font-weight: 700; color: ${c.accent}; border-top: 1px solid #e5e7eb; border-bottom: none; padding-top: 6px; }
  .notes-section { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 16px; }
  .notes-label { font-size: 9px; color: #9ca3af; margin-bottom: 4px; }
  .notes-text { font-size: 11px; color: #4b5563; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; }
  .footer-note { font-size: 10px; }`;

    // ── Stripe: accent top + right side stripe, split-panel header ────────────────
    if (t === "stripe") return base + `
  .page { padding: 0; display: flex; flex-direction: column; min-height: 100%; }
  .doc-header { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 0; }
  .brand { flex: 1; padding: 36px 40px; background: ${c.accent}; color: #fff; }
  .brand span { display: block; font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.55); margin-top: 2px; }
  .doc-meta { padding: 36px 40px; background: ${c.light}; text-align: right; min-width: 200px; border-bottom: 4px solid ${c.accent}; }
  .doc-number { font-size: 22px; font-weight: 700; color: ${c.accent}; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #71717a; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }
  .brand { font-size: 22px; font-weight: 700; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; padding: 0 40px; margin-top: 32px; }
  .party-card { padding: 16px; border: 1px solid #e5e7eb; border-top: 3px solid ${c.accent}; border-radius: 0 0 8px 8px; }
  .party-label { color: ${c.mid}; }
  .dates { display: flex; gap: 16px; margin-bottom: 28px; padding: 0 40px; }
  .date-item { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px; }
  .date-label { color: #71717a; }
  table { margin: 0 40px 24px; width: calc(100% - 80px); }
  .totals { padding: 0 40px; margin-bottom: 32px; }
  .totals-row { color: #6b7280; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: ${c.accent}; border-top: 2px solid ${c.accent}; border-bottom: none; padding-top: 10px; }
  thead tr { background: ${c.accent}; color: #fff; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: #f9fafb; }
  tbody td { color: #374151; }
  .notes-section { margin: 0 40px 28px; padding: 14px; border: 1px solid #e5e7eb; border-top: 3px solid ${c.accent}; }
  .notes-label { color: ${c.mid}; }
  .notes-text { color: #4b5563; }
  .footer { border-top: 1px solid #e5e7eb; padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Bureau: centered formal header, horizontal rules ──────────────────────────
    if (t === "bureau") return base + `
  .page { padding: 40px 48px; }
  .doc-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 0; padding-bottom: 20px; border-top: 4px double ${c.accent}; border-bottom: 4px double ${c.accent}; padding-top: 20px; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: 700; color: ${c.accent}; letter-spacing: -0.5px; text-align: center; }
  .brand span { display: block; font-size: 12px; font-weight: 600; color: #6b7280; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
  .doc-meta { text-align: center; margin-top: 12px; }
  .doc-number { font-size: 18px; font-weight: 700; color: #1c1917; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #9ca3af; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 0; }
  .divider { display: none; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
  .party-card { padding: 0; }
  .party-label { color: ${c.mid}; border-bottom: 1px solid ${c.border}; padding-bottom: 4px; margin-bottom: 10px; }
  .dates { display: flex; gap: 0; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
  .date-item { flex: 1; padding: 0 16px 0 0; border-right: 1px solid #e5e7eb; margin-right: 16px; }
  .date-item:last-child { border-right: none; margin-right: 0; }
  .date-label { color: ${c.mid}; }
  thead tr { background: transparent; border-top: 2px solid ${c.accent}; border-bottom: 2px solid ${c.accent}; }
  thead th { color: ${c.accent}; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: ${c.light}; }
  tbody td { color: #374151; }
  .totals-row { color: #6b7280; border-bottom: 1px solid #f4f4f5; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: ${c.accent}; border-top: 2px solid ${c.accent}; border-bottom: 2px solid ${c.accent}; padding-top: 8px; padding-bottom: 8px; }
  .notes-section { padding: 14px; border: 1px solid #e5e7eb; margin-bottom: 28px; }
  .notes-label { color: ${c.mid}; }
  .notes-text { color: #4b5563; }
  .footer { border-top: 4px double ${c.accent}; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }`;

    // ── Classic (default) ─────────────────────────────────────────────────────────
    return base + `
  .page { padding: 40px; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 700; color: ${c.accent}; letter-spacing: -0.5px; }
  .brand span { display: block; font-size: 11px; font-weight: 500; color: #a1a1aa; letter-spacing: 0; margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-number { font-size: 20px; font-weight: 700; color: ${c.accent}; font-variant-numeric: tabular-nums; }
  .doc-date { font-size: 11px; color: #a1a1aa; margin-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; background: ${c.badge}; color: ${c.badgeText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; }
  .divider { margin-bottom: 28px; border: none; border-top: 3px double ${c.border}; padding-top: 3px; border-bottom: 1px solid ${c.border}; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .party-card { background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; }
  .party-label { color: #6b7280; }
  .dates { display: flex; gap: 20px; margin-bottom: 28px; }
  .date-item { background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 16px; }
  .date-label { color: #6b7280; }
  thead tr { background: ${c.accent}; color: #fff; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr.even { background: #f9fafb; }
  tbody td { color: #374151; }
  .totals-row { color: #6b7280; }
  .totals-row.grand { font-size: 15px; font-weight: 700; color: ${c.accent}; border-bottom: none; border-top: 1px solid #d1d5db; padding-top: 10px; }
  .notes-section { background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
  .notes-label { color: #6b7280; }
  .notes-text { color: #4b5563; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }`;
};

export const needsBodyWrapper = (t) => (t === "modern" || t === "executive");
