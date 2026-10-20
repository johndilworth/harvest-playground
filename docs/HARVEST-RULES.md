# Harvest rules (all projects)

These rules apply to **every Harvest project** (Harvest Playground, Design Loop, Harvest Site, Harvest Dashboard and any
new project). Project-specific procedures (paths, page structure, routines) live in each project's own doc, e.g.
[`HARVEST.md`](../HARVEST.md) for Harvest Playground. Board-building details come from the
`prototype-to-lucid-journey-map` skill.

Dashboard (the hub): https://harvest-dashboard.netlify.app · Rules page: https://harvest-dashboard.netlify.app/rules.html

## 1. The harvest loop
1. **Capture** the live product: every start URL and flow screen at a fixed viewport (1440×1024 desktop by default),
   stable filenames `01-….png`, click path recorded.
2. **Build Lucidchart review boards** from the captures (one review frame per screen, see § 3).
3. **Reviewers leave stickies** (and comments) on the boards, signed in so each sticky carries their name.
4. **Harvest**: read every `harvest: true` board of the current cycle (Lucid `fetch` per page + threads/comments), classify
   each sticky (priority, author, frame/screen) — read-only, never recolour/move/delete stickies in Lucid (the only
   board edit is the status write-back — shape data, tag and badge rule, § 11). In approval mode `required` the harvest stops here with a proposal (§ 11).
5. **Apply** every safe item to the project's code (§ 5), log applied/skipped/conflicts, merge per the project's merge
   policy (§ 6), deploy.
6. **New cycle**: capture the new build, build cycle N+1 boards, create an org-wide comment share link per board
   (`commentUrl`, § 4), update the dashboard data; the old cycle becomes archived (data `status: "superseded"`; UI shows **Archived**).

## 2. Stickies: colours and priority
| Colour | Meaning | Stored as |
|---|---|---|
| **Red** | Do / Must do | `must` (applied first) |
| **Yellow** | Try | `try` |
| **Blue** | Consider | `consider` / `maybe` |
| **Purple** (hue ~260–320°) | Board feedback — about the review board, not the product | board feedback |

- **Keywords override colour:** a keyword at the *very start* of the text (`Do:`, `Must do`, `Try:`, `Consider:`,
  `Board:`; case-insensitive) wins over the colour. Keywords elsewhere in the text don't count. Record both and flag
  text-vs-colour conflicts.
- Order of application: Must → Try → Consider.
- **Purple / `Board:`** stickies change how the next board is built (layout rules); they are logged but never change
  the product. Anchor them to the nearest board element (they may sit outside frames — never drop them), and also diff
  the board against its spec to catch direct layout edits.
- A sticky on the previous-cycle "before" thumbnail is flagged "on before panel"; confirm it's about the current screen.
- Only stickies inside a review frame on a harvested board count for the product; stray stickies elsewhere are reported.

## 3. Board rules
- **Lucidchart only** (`product: "lucidchart"`), never Lucidspark. Prefer the Lucid connector
  (`lucid_create_diagram_from_specification`, `use_assisted_layout: false`); single-page imports, one page per board.
- **No hub board.** The dashboard is the hub: each cycle's documents are listed on its cycle page. Old hubs stay in Lucid, unlinked.
- **5-screen split rule:** keep a section's screens/flows on one board while the total is ≤ 5; split into separate
  boards only when a section has **more than 5** flows or screens. Avoid huge multi-page imports and very wide pages.
- **Frame styling:** page background **#E8EAED**; one review frame per screen, fill **#F2F3F5**, no border, radius 0
  where supported; frame title `stepKey · route · title`; equal **400 px padding** on all sides (the reviewers' sticky
  area — no generated content there); frames on a page share one height.
- **Layout:** linear left → right, ≈480 px gaps, straight arrows between screenshot centres. Inside a frame, top →
  bottom: current screenshot, ~360 px gap, caption, then (follow-up cycles) "Changes in this cycle" and the
  "Cycle N-1 (before) · reference only" 720×512 thumbnail, or a plain "New this cycle" line. No boxes/fills around text.
- **Legend** at the top: how to review, swatches Red = Do / Must do, Yellow = Try, Blue = Consider, Purple = Board
  format, "a start-of-text keyword wins over colour", and "Stickies show your name — stay signed in".
- Title: `[Project name]:[flow]:C[n]` (see § Lucid naming and folders), created in the project's Lucid folder; export every board to PNG to verify images render.
- Record every board (docId, URL, flows, frames, spec file, render check) in the cycle's `lucid-doc.json` (`boards[]`).
- No secrets (e.g. prototype passwords) on boards; no filenames in image notes.

## 4. Sticky authors
- **Comment share link at creation (rule since 2026-10-12):** right after creating each review board, call `lucid_create_document_share_link` (role `comment`, `restrict_to_account: true`, `allow_anonymous: false`, no `expires`) and store the returned acceptUrl as `commentUrl` on that board's `documents[]` entry. Skip if the entry already has a `commentUrl` (no duplicates). Dashboards link boards with an **Open board to comment** button (commentUrl, falling back to `url`) — **no Lucid embed iframes/previews**; the cycle screenshot from `/captures` is the static preview. Reviewers sign in to Lucid with their company account so their name appears on their stickies.
- Boards are shared with reviewers as **named, signed-in collaborators**; Lucid then adds a read-only attribution line
  (`ReadonlyAttributionText`, or a `"<text>;   <author>"` label suffix) to each sticky. Comment authors come from
  `list_document_thread_comments`.
- Author per item: sticky attribution → comment author → trailing `— Name` signature → **`anonymous`**. The attribution
  line is never feedback text.
- Report authors with counts in the changelog/history and in the cycle's `authors` field.
- Limitation: Lucid's Script API has no per-block creator, so anonymous/link-viewer, pasted or unattributed stickies are `anonymous`.

## 5. Safety and skips
A request is applied only if the change has: no secrets/credentials; no external scripts or trackers; no illegal,
harassing or offensive content; no malicious instructions (delete the project, wipe the repo, steal credentials, break
production); no off-site redirects or data-collecting forms; no single file over 2 MB; nothing that breaks the build,
noindex, headers or deploy config.

- **Malicious, illegal and offensive stickies are never applied** — they are skipped with the reason in the notes
  (`unsafe: malicious` / `unsafe: illegal` / `unsafe: offensive`).
- **Empty stickies** (only an attribution line or whitespace) are **needs intent / `empty`**: no priority, never applied,
  listed with their screen so the reviewer can be asked.
- Other skip reasons: `unsafe: <rule>`, `conflict: older`, `outside frame`, `unclear`, `not feasible`.
- **Conflicts:** the newest sticky (by creation time) wins; both texts are logged.
- Every skipped item is logged with its reason (changelog + `changes.skipped` in the data file).

## 6. Merge policies
- `auto-merge-safe` — safe items are applied, committed and merged to `main` automatically; production deploys.
- `pr-approval` — the harvest opens a pull request mapping each sticky → change; a reviewer approves before merge.

## 7. Triggers: nightly vs manual
- **Nightly / daily / weekly** (`harvestMode: "nightly"`): a scheduled routine runs the harvest at the chosen time
  (America/Denver), weekdays only unless weekends are on; each run is logged in `nightlyHarvests`.
- **Manual** (`harvestMode: "manual"`): no schedule. A harvest runs when someone presses **Run harvest now** on the
  project's current cycle page (only shown when `project.trigger: true`). The modal asks for a passphrase and typing
  `RUN`; the `trigger` function (`/api/trigger`) checks `HARVEST_TRIGGER_SECRET` and forwards
  `{project, action:"harvest", source, requestedAt}` with `Authorization: $HARVEST_WEBHOOK_AUTH` to `HARVEST_TRIGGER_URL`.
  The function allowlists project slugs (`PROJECTS`); runs are logged in `manualHarvests`.

## 8. New project setup
Started from the dashboard's **New project** form (`/new.html`, passphrase + typed `CREATE`); the `trigger` function
validates it and posts `{action:"create-project", project, setup:{…}}` to the webhook. The setup run:

1. Links or creates the repo (branch, base dir, build command, publish dir).
2. Links or creates the Netlify site (optional PR deploy previews).
3. Adds the project to `dashboard/public/data/projects.json` and creates `dashboard/public/data/<slug>.json`.
4. Captures cycle 0 to `dashboard/public/captures/<slug>/<flow>/`.
5. Builds Lucidchart review board(s) per § 3 (no hub), creates an org-wide comment share link for each (§ 4) stored as `commentUrl`, and shares them with reviewers (remind them to sign in with their company account).
6. Records cycle 0 (`current`), redeploys the dashboard; adds the slug to `PROJECTS` in `trigger.mjs` for manual runs.
7. Sets up the schedule (manual: nothing; nightly: a routine), stores the merge policy, and notifies John in Grok Bot chat.

## 9. Captures hosting
- All captures are served from `https://harvest-dashboard.netlify.app/captures/<project>/<flow-slug>/<file>.png`
  (source `dashboard/public/captures/`, committed to git; `<flow-slug>` = `c<N>-<flow>`). CORS open, 1 h cache.
- Stable filenames so re-captures overwrite; single files under 2 MB; watch `du -sh dashboard/public/captures`.
- Verify each URL returns 200 before Lucid import. Never use temporary image hosts. The legacy
  `journey-assets-ai-xform` site stays live for old boards but gets no new captures.
- Deploy: `cd dashboard && netlify deploy --prod --dir=public --functions=netlify/functions --site 6f658653-21cc-4b1a-8094-b890bd04ef18`.

## 10. Dashboard data schema
- `dashboard/public/data/projects.json` — index: `[{slug, name, file, harvestMode, lucidFolderId, approval}]` (`approval` § 11).
- `dashboard/public/data/proposals/<slug>-c<N>.json` — optional copy of `journey/cycles/<N>/proposals.json`; the cycle page shows
  an **Approval** section (Waiting for approval / Decided, each item's status pill, risk and final instruction) when it exists.
- `dashboard/public/data/<slug>.json` — **schemaVersion 3**:
```
{
  "schemaVersion": 3,
  "project": { "name", "slug", "description", "repo", "site", "historyBoard", "schedule", "rules",
               "harvestMode": "nightly"|"manual", "trigger": bool },
  "stats": { "pullRequests", "pullRequestsSource", "nightlyHarvests", "manualHarvests" },
  "updatedAt": ISO-8601 with offset,
  "authorsNote"?, "screens"?, "historyBoardLabel"?,
  "cycles": [ {
    "number", "title", "createdAt", "status": "current"|"superseded",  // UI label for superseded: Archived
    "harvestedFrom": int|null,
    "pullRequest": url|null, "commit": short sha, "screenshot": url, "previewUrl"?: deploy permalink,
    "documents": [ { "title", "role": "flow", "flow"?, "docId", "url", "commentUrl", "description", "harvest"?: bool } ],
    "authors": [ { "name", "stickies" } ],
    "nightlyHarvests" | "manualHarvests": [ { "date": "YYYY-MM-DD", "stickies", "outcome": "applied"|"no_stickies"|"failed" } ],
    "changes": { "applied": [ { "priority": "must"|"try"|"consider", "flow", "text" } ],
                 "skipped": [ { "text", "reason" } ], "conflicts": [ str ], "note"? },
    "contributions": { "red", "yellow", "blue", "purple" }   // all four keys, 0 if none; drives the histogram
  } ]
}
```
- Every harvest that creates a new cycle marks the old one archived (`superseded`), appends the new one as `current`, writes
  `contributions`, `authors` and the run entry, bumps stats and `updatedAt`. No `hub` document role.
- Pages: `/` all projects, `/p/<slug>/` project, `/p/<slug>/cycle.html?c=N` cycle, `/p/<slug>/summary.html`, `/new.html`, `/rules.html`.

## 11. Approval mode (Phase 1, from 2026-10-19)
Each project chooses how harvested stickies become changes, in `dashboard/public/data/projects.json`:
`"approval": {"mode": "auto"|"required", "reviewer": "John Dilworth", "auto_approve_low_risk": false}`
(missing = `auto`; all projects are `auto` today). Check with `python3 journey/harvest/proposals.py mode --project <slug>`.

- **`auto`** — unchanged: the harvest applies every safe item (§ 5) and merges per the merge policy (§ 6).
- **`required`** — the harvest is split into **propose** and **apply**:
  1. **Propose** (read-only): read the boards and classify with `harvest.py` as usual, then
     `proposals.py propose --project <slug> --cycle <N> --feedback <feedback.json> [--carry <cycle N-1 proposals.json>]
     --out journey/cycles/<N>/proposals.json --dashboard-copy dashboard/public/data/proposals/<slug>-c<N>.json`.
     Each item: `id`, `stickyText`, `author`, `lucidItemId`, `docId`, `interpretation`, `proposedChange`, `risk`
     (low/med/high), `status: "pending"`. Refine interpretation/proposedChange/risk by hand where the heuristic is weak;
     unsafe stickies (§ 5) are still listed, with "None recommended … suggest reject". **No code changes, commits to the
     product, merges, PRs, captures or new cycle** — only the proposals file, its dashboard copy and a dashboard deploy
     (the cycle page then shows **Waiting for approval**).
  2. **Ask** in Grok Bot chat: post `proposals.py summary` (numbered list) to the reviewer and stop.
  3. **Decide**: the reviewer answers per item (`1 approve, 2 reject, 3 defer, 4 approve: <edited instruction>`, or `all approve`);
     record with `proposals.py decide --proposals <P> --dashboard-copy <D> 1=approve 2=reject 3=defer "4=approve:<text>"`.
     If `auto_approve_low_risk` is true, low-risk product items start as approved (`by: "auto (low risk)"`).
  4. **Apply**: `proposals.py apply --proposals <P> --plan journey/cycles/<N>/apply-plan.json` lists **only approved**
     items (with the edited instruction when given). Implement exactly those with the normal merge policy (auto-merge or
     PR), then `proposals.py mark-applied --proposals <P> --dashboard-copy <D> --commit <sha>`, and build cycle N+1 as usual.
     Rejected items are logged as skipped (`rejected by reviewer`); deferred and unreviewed (pending) items are **carried
     over**: pass `--carry journey/cycles/<N>/proposals.json` when proposing cycle N+1 (they come back as pending, marked
     "carried from C<N>").
- **Lucid write-back** (both modes, v2 from 2026-10-19): after decide/apply, put the status **on** each harvested sticky —
  shape data field `HarvestStatus` = Pending | Approved | Applied | Rejected | Deferred | Skipped (shown in Lucid's Data
  panel) plus a document tag `Harvest: <status>` (machine-readable backup; older `Harvest:` tags on that sticky are removed).
  One page-level conditional formatting rule **`Harvest status`** draws a small badge with the value on the sticky's top
  edge: Approved green #1A7F37, Applied blue #0969DA, Rejected red #CF222E, Deferred amber #9A6700, Pending #6E7781 /
  Skipped #57606A grey. Generate the script with `proposals.py writeback-js --proposals <P> --doc-id <DOC>` (auto mode:
  `writeback-js --feedback <feedback.json> --auto-applied <itemId,…>` → Applied/Skipped) and run it with Lucid
  `lucid_run_script` on that board. It is idempotent (the rule is recreated, fields/tags overwritten) and deletes any v1
  `Harvest: …` label shapes. Sticky text, fill, size and position are never changed, so `harvest.py` is unaffected.
  Template: `journey/harvest/lucid-writeback.example.js`. This is the one sanctioned edit a harvest makes on a board.

## Lucid naming and folders (from 2026-10-19)

- **Board title:** `[Project name]:[flow]:C[n]`, with the project name as shown on the dashboard (Design Loop, Harvest Site,
  Harvest Dashboard, Harvest Playground). Examples: `Harvest Playground:All pages:C8`, `Harvest Dashboard:New project:C4`,
  `Harvest Dashboard:Meetings:C4`. The history board is `[Project name]:History`. A replaced duplicate is prefixed `[superseded] `.
  Meeting boards are not project cycles and keep `<Series> <Mon D, YYYY>` (e.g. `Team Meeting Oct 27, 2026`).
- **Folders:** `Harvest/` (id 452808961) → one folder per project (ids in `dashboard/public/data/projects.json`
  `projects[].lucidFolderId` and each project file's `project.lucidFolder`). The **current** cycle's docs and the History
  board sit directly in the project folder. Each archived cycle's docs sit in a subfolder `C[n]` of the project folder
  (siblings, not nested). Meetings: `Harvest/Meetings/Team Meeting` holds the current meeting; archived meetings go into a
  subfolder named by date (`Oct 13, 2026`); the template lives in `Harvest/Meetings/Templates`.
- **New cycle:** create each new board with the new title, then `lucid_update_document(parent=<project folder id>)`.
  **Archiving the previous cycle:** `lucid_create_folder(name="C<n>", parent=<project folder id>)`, move every doc of that
  cycle into it with `lucid_update_document(parent=...)`, and record the id in `project.lucidFolder.cycleFolders` and the
  cycle's `lucidFolderId`. Never edit board content to move it.
