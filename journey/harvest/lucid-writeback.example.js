// Harvest write-back: small status label above each harvested sticky (lucid_run_script source).
// Generate a filled-in copy with: python3 journey/harvest/proposals.py writeback-js --proposals <P> --doc-id <DOC>
// Proven on scratch doc 9295615f-cbbe-4a52-bcb1-88d5e05ee9f0 (2026-10-19). Idempotent: re-running replaces earlier
// "Harvest: …" labels sitting in the strip above the same sticky. Labels are DefaultSquareBlock (harvest.py ignores them,
// and skips any text starting "Harvest: "). Never moves, recolours or edits the sticky itself.
const b = skills.basecanvasediting, T = skills.text;
const LABELS = [{ itemId: "STICKY_ID", status: "Approved" }];
const COLORS = { Pending: "#6E7781", Approved: "#1A7F37", Applied: "#0969DA", Rejected: "#CF222E", Deferred: "#9A6700", Skipped: "#57606A" };
const H = 26, GAP = 6;  // label width = sticky width (min 120) so it never overhangs neighbours
// collect existing Harvest labels on the page
const r = await b.read({ blockProperties: ["BoundingBox", "TextAreas"] });
const old = [];
(function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk);
  if (!o || typeof o !== "object") return;
  const t = o.text || o.label || "";
  const id = o.id || o.itemId || o.shapeId;
  if (id && typeof t === "string" && t.startsWith("Harvest: ")) old.push(id);
  Object.values(o).forEach(walk);
})(JSON.parse(JSON.stringify(r.pages)));  // plain copy: read() results reject unknown-field access
const oldInfo = old.length ? b.inspect(old) : [];
const stickies = b.inspect(LABELS.map((l) => l.itemId));
const done = [], missing = [], removed = [];
for (let i = 0; i < LABELS.length; i++) {
  const s = stickies[i], L = LABELS[i];
  if (!s || s.kind === "error") { missing.push(L.itemId); continue; }
  const bb = s.boundingBox, x = bb.x, y = bb.y - H - GAP, W = Math.max(120, bb.w);
  const stale = oldInfo.filter((o) => o.kind !== "error" && Math.abs(o.boundingBox.x - x) < 40 && Math.abs(o.boundingBox.y - y) < 40).map((o) => o.id);
  if (stale.length) { b.deleteItem({ itemIds: stale }); removed.push(...stale); }
  const lab = await b.createBlock({ className: "DefaultSquareBlock", x, y, width: W, height: H, label: "Harvest: " + L.status });
  b.editBlockStyle({ itemId: lab.id, fillColor: COLORS[L.status] || "#57606A", lineWidth: 0 });
  await T.setItemTextStyle({ itemId: lab.id, styles: [{ style: "textColor", value: "#FFFFFF" }, { style: "fontSize", value: "7" }] });
  done.push({ sticky: L.itemId, label: lab.id, status: L.status });
}
return { done, missing, removed };
