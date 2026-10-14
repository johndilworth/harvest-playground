// lucid_run_script (no extra skill needed): every block with class, text, bbox, parent frame.
// Proven alternative: MCP `fetch` (page 1) returns the same data incl. card title/owner/status/endTime
// (custom fields like "Source Meeting" only via skills.lucidcards.read).
const b = skills.basecanvasediting;
const r = await b.read({ blockProperties: ["BlockClass", "BoundingBox", "TextAreas", "TextAlign"] });
const ids = []; const walk = (o) => { if (o && typeof o === "object") { for (const k of ["id", "itemId", "shapeId", "containerId"]) if (typeof o[k] === "string") ids.push(o[k]); Object.values(o).forEach(walk); } };
walk(r.pages); const uniq = [...new Set(ids)];
const ins = await b.inspect(uniq);
const frames = ins.filter((i) => i.className === "SparkFrameBlock").map((f) => ({ id: f.id, label: f.label, bb: f.boundingBox }));
const objs = ins.filter((i) => ["StickiesStickyNoteBlock", "LucidCardBlock", "AutoGrowTextBlock"].includes(i.className))
  .map((i) => ({ id: i.id, cls: i.className, bb: i.boundingBox, parent: i.parent, text: (i.properties.TextAreas || []).filter((a) => a.key === "Text" || a.key === "t_Title").map((a) => a.text).join(" ") }));
return { frames, objs };
