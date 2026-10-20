# journey/harvest
- `harvest.py` — classify a Lucid board fetch into `feedback.json` (see its docstring). Skips `Harvest: …` write-back labels.
- `proposals.py` — approval mode (HARVEST-RULES § 11): `mode`, `propose`, `summary`, `decide`, `apply`, `mark-applied`,
  `carry`, `writeback-js`. Run `python3 journey/harvest/proposals.py -h`.
- `lucid-writeback.example.js` — `lucid_run_script` template that puts a small coloured status label
  (`Harvest: Approved|Applied|Rejected|Deferred|Pending|Skipped`) above each sticky; `proposals.py writeback-js` fills in
  `LABELS`. Idempotent; never edits the sticky. Gotchas: `basecanvasediting.read()` results throw on unknown-field access
  (walk a `JSON.parse(JSON.stringify(...))` copy); bold 8 pt wraps "Deferred" on a 160 px sticky, so labels use 7 pt regular.

## Dry run (2026-10-19, scratch doc 9295615f-cbbe-4a52-bcb1-88d5e05ee9f0 "Harvest cards test (scratch)")
`dryrun/`: `p1.json` (fetch with 5 fake stickies + 1 card), `feedback.json`, `proposals.json` (decided: 1 approve, 2 reject,
3 defer, 4 approve with edited instruction, 5 defer, 6 left pending), `apply-plan.json` (only c99-01 and c99-04),
`carry.json` (c99-03, c99-05, c99-06), `writeback.js` (generated script that was run on the scratch doc),
`dashboard-approval.png` (cycle page with a local copy of the proposals, dark mode).
