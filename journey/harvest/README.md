# journey/harvest
- `harvest.py` — classify a Lucid board fetch into `feedback.json` (see its docstring). Skips `Harvest: …` write-back labels.
- `proposals.py` — approval mode (HARVEST-RULES § 11): `mode`, `propose`, `summary`, `decide`, `apply`, `mark-applied`,
  `carry`, `writeback-js`. Run `python3 journey/harvest/proposals.py -h`.
- `lucid-writeback.example.js` — `lucid_run_script` template (v2): sets shape data `HarvestStatus=<status>` and tag
  `Harvest: <status>` on each sticky, (re)creates one page rule `Harvest status` (conditional formatting text badge on the
  sticky's top edge, one else-if branch per status colour) and deletes v1 `Harvest: …` label shapes. `proposals.py
  writeback-js` fills in `LABELS` (later entries for the same sticky win; `--labels id=Status` overrides). Idempotent.
  Gotchas: `basecanvasediting.read()` results throw on unknown-field access (walk a JSON copy); `fetch` does not return
  shape data (read it with `skills.formulas.getShapeDataField`), but does list tags; badges render in PNG exports, tags don't.
  The rule applies to the page that is current when the script runs (one run per page).

## Dry run (2026-10-19, scratch doc 9295615f-cbbe-4a52-bcb1-88d5e05ee9f0 "Harvest cards test (scratch)")
`dryrun/`: `p1.json` (fetch with 5 fake stickies + 1 card), `feedback.json`, `proposals.json` (decided: 1 approve, 2 reject,
3 defer, 4 approve with edited instruction, 5 defer, 6 left pending), `apply-plan.json` (only c99-01 and c99-04),
`carry.json` (c99-03, c99-05, c99-06), `writeback.js` (generated v2 script run twice on the scratch doc, all six statuses),
`dashboard-approval.png` (cycle page with a local copy of the proposals, dark mode).
