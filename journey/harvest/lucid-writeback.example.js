// Harvest write-back v2 (lucid_run_script source): status ON the sticky, no extra shapes.
// Generate a filled-in copy with: python3 journey/harvest/proposals.py writeback-js --proposals <P> --doc-id <DOC>
// For each sticky in LABELS: shape data field HarvestStatus=<status> (visible in Lucid's Data panel) and a document tag
// "Harvest: <status>" (machine-readable backup; older Harvest: tags on that sticky are removed). One page-level conditional
// formatting rule "Harvest status" draws a coloured text badge (the field value) on the sticky's top edge; it is deleted and
// recreated on every run, so the script is idempotent. Old v1 "Harvest: …" label shapes on the page are deleted.
// Never changes sticky text, fill, size or position. Run once per board page (navigate first if the board has >1 page).
const F = skills.formulas, A = skills.blockannotations, C = skills.conditionalformatting, b = skills.basecanvasediting;
const LABELS = [{ itemId: "STICKY_ID", status: "Approved" }];
const COLORS = { Pending: "#6E7781", Approved: "#1A7F37", Applied: "#0969DA", Rejected: "#CF222E", Deferred: "#9A6700", Skipped: "#57606A" };
const FIELD = "HarvestStatus", RULE = "Harvest status", POS = { horizontal: "center", vertical: "top", layer: "edge" };
const out = { set: [], missing: [], removedShapes: [], rule: null };
// 1. remove v1 label shapes ("Harvest: …" text blocks)
const r = await b.read({ blockProperties: ["TextAreas"] });
const old = [];
(function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk);
  if (!o || typeof o !== "object") return;
  const t = o.text || o.label || "", id = o.id || o.itemId || o.shapeId;
  if (id && typeof t === "string" && t.startsWith("Harvest: ") && (o.properties || {}).BlockClass !== "StickiesStickyNoteBlock") old.push(id);
  Object.values(o).forEach(walk);
})(JSON.parse(JSON.stringify(r.pages)));  // plain copy: read() results reject unknown-field access
if (old.length) { b.deleteItem({ itemIds: old }); out.removedShapes = old; }
// 2. per sticky: shape data + tag
for (const L of LABELS) {
  if (!A.get(L.itemId)) { out.missing.push(L.itemId); continue; }
  if (F.getShapeDataField(L.itemId, FIELD)) F.setShapeDataValue(L.itemId, FIELD, L.status);
  else F.addShapeDataField(L.itemId, FIELD, L.status);
  for (const t of A.getBlockTags(L.itemId)) if (t.label.startsWith("Harvest: ") && t.label !== "Harvest: " + L.status) A.removeTagFromBlock(L.itemId, t.id);
  A.tagBlock(L.itemId, "Harvest: " + L.status, COLORS[L.status]);
  out.set.push({ sticky: L.itemId, status: L.status, value: F.getShapeDataField(L.itemId, FIELD).value });
}
// 3. one page-level rule with a badge branch per status (recreated each run => idempotent)
for (const x of C.listRules()) if (x.name === RULE) C.deleteRule(x.id);
const badge = (s) => ({ textBadge: { text: { field: FIELD }, backgroundColor: COLORS[s], position: POS } });
const cond = (s) => ({ type: "shapeData", field: FIELD, operator: "equals", value: s });
const statuses = Object.keys(COLORS);
const rule = C.createRule({ name: RULE, condition: cond(statuses[0]), style: badge(statuses[0]), applyTo: "page" });
for (const s of statuses.slice(1)) C.addElseIf(rule.id, { condition: cond(s), style: badge(s) });
out.rule = { id: rule.id, rules: C.listRules().filter((x) => x.name === RULE).length };
return out;
