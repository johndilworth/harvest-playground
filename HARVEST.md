# Harvest rules (nightly) — Harvest Playground

> **Generic rules for all Harvest projects** (loop, sticky colours/priority, board rules, sticky authors, safety skips,
> merge policies, triggers, new project setup, captures hosting, dashboard data schema) live in
> [`docs/HARVEST-RULES.md`](docs/HARVEST-RULES.md) (rendered at https://harvest-dashboard.netlify.app/rules.html).
> This file keeps the Harvest Playground–specific procedure; where the two differ, the generic doc wins for shared rules.
> After editing the generic doc, run `python3 dashboard/build_rules.py` and redeploy the dashboard.

The playground grows one Harvest cycle per day. Anyone on the team can ask for anything by leaving a sticky
on the current cycle's flow board in Lucid.

## Schedule
- **5:00 pm MT (America/Denver) daily:** stickies on the current cycle's flow board(s) are harvested.
- Every **safe** item is applied automatically to `site/`, committed, and merged to `main`.
  Netlify deploys `main` to production automatically.
- By the next morning a new cycle review board (Lucidchart, no hub) exists for cycle N+1 and is listed on the dashboard.

## What gets harvested
- Only stickies **inside a review frame** on a flow board listed in `journey/cycles/<N>/lucid-doc.json`
  (`boards[]` with `"harvest": true`). Legacy Cycle 0–4 hubs are never harvested (and no new hubs are made, see § Board rules).
- Priority: a leading `Do:` / `Must do` (red), `Try:` (yellow), `Consider:` (blue). The words win over the colour;
  otherwise the colour counts. Must items go first, then Try, then Consider.
- Purple stickies (or text starting with `Board:`) are feedback about the board itself, not the site. They change
  how the next board is built and are logged, but they don't change the site.
- **Empty stickies are skipped** (logged as `needs intent`).

## What counts as safe
A request is applied only if the resulting change has:
1. **No secrets or credentials** (tokens, keys, passwords, private URLs).
2. **No external scripts or trackers** (no third-party `<script>`, analytics, pixels, embeds that load remote code).
3. **No illegal, harassing, or offensive content** (nothing hateful, harassing, sexual, defamatory, infringing, or
   otherwise offensive).
4. **No malicious instructions** (for example "delete the project", wipe the repo, remove the site, steal credentials,
   or intentionally break production). Leave those out entirely.
5. **No off-site redirects and no forms that collect data** (no `<meta refresh>`/JS redirects to other sites, no
   inputs that submit or store anyone's information). Plain outbound links are fine.
6. **No huge assets** (any single file over **2 MB** is rejected; prefer CSS/SVG/text).
7. **Nothing that breaks the build** (the site stays static under `site/`; `netlify.toml`, `_headers`, `robots.txt`
   and the `noindex` meta stay as they are).

Anything else is fair game: new sections, colours, jokes, art, layout changes, etc.

## Conflicts
If two requests conflict (e.g. "make the background blue" vs "make it green"), the **newest** sticky (by creation
time) is applied and the conflict is logged in CHANGELOG.md with both sticky texts.

## Skipped items
Every item that isn't applied is logged in CHANGELOG.md (that night's publish notes) with a reason:
`unsafe: <rule>` (including `malicious`, `illegal`, `offensive`), `empty`, `conflict: older`, `outside frame`,
`unclear`, or `not feasible`. Malicious, illegal, and offensive stickies are never applied; only noted.

## Where things go in the page
- New content goes in `<main id="sections">` in `site/index.html` as
  `<section class="block" id="c<N>-<slug>">...</section>`, newest at the bottom unless the sticky says otherwise.
- New CSS goes below the `---- cycle styles below ----` marker in `site/styles.css`.
- Bump the footer: `<span id="cycle">Cycle N</span>`.

## Nightly procedure (for the routine)
0. Check the approval mode: `python3 journey/harvest/proposals.py mode --project harvest-playground`. If `required`,
   follow § Approval mode instead of steps 3–8.
1. Read `journey/cycles/<N>/lucid-doc.json`; for every board with `"harvest": true`:
   Lucid `fetch(id, metadata_only)`, `fetch(id, page_index)` per page, `list_document_threads` + comments. Save raw
   responses under `journey/out/c<N>/raw/`.
2. Classify:
   `python3 journey/harvest/harvest.py --doc-id <DOC> --cycle <N> --fetch journey/out/c<N>/raw/p1.json --threads journey/out/c<N>/raw/threads.json --manifest journey/cycles/<N>/manifest.json --out journey/cycles/<N>/feedback.json`
3. Apply each item against the safety rules above; resolve conflicts (newest wins); log everything.
4. Set the footer to `Cycle N+1`, add a `## Cycle N+1` entry to CHANGELOG.md (applied / skipped / conflicts / board
   feedback), commit, push to a branch, and merge to `main` (or push to `main`). Netlify auto-deploys.
5. Wait for the production deploy to be `ready`, then capture:
   `cd journey && node capture.mjs --cycle <N+1> --out out/c<N+1>` (1440×1024 viewport `01-home.png`, plus
   `02-home-full.png` if the page grows taller than 1024 px).
6. Host the images on the dashboard under `/captures/harvest-playground/c<N+1>-<flow>/` (copy into
   `dashboard/public/captures/harvest-playground/c<N+1>-<flow>/`, then run the dashboard deploy command in § Dashboard).
   URL: `https://harvest-dashboard.netlify.app/captures/<project>/<flow-slug>/<file>.png` (see § Screen captures).
7. Build the next cycle review board(s) **as Lucidchart documents** (`product: "lucidchart"`, never Lucidspark) per
   § Board rules (single-page imports; keep screens on one board until a section has more than 5 flows or screens, then
   split; **no hub board**; rules from the prototype-to-lucid-journey-map skill including page background #E8EAED with
   frames #F2F3F5, extra-roomy frames, sticky-author line in the review legend). Export every board to verify, and save
   `journey/cycles/<N+1>/` (`lucid-doc.json` with `boards[]` only, specs, manifest).
8. Update the dashboard (§ Dashboard, nightly step 8) — it is the hub: every board of the new cycle goes into that
   cycle's `documents`, plus `previewUrl` and `authors`.

## Approval mode (required) — chat approval, Phase 1
Setting: `approval` on this project in `dashboard/public/data/projects.json` (generic rules: HARVEST-RULES § 11). Harvest
Playground is **`auto`** (the procedure above runs unchanged). When it is `required`, the nightly/manual run does this instead:
1. Steps 1–2 of the nightly procedure (fetch + `harvest.py`), then
   `python3 journey/harvest/proposals.py propose --project harvest-playground --cycle <N> --feedback journey/cycles/<N>/feedback.json --carry journey/cycles/<N-1>/proposals.json --out journey/cycles/<N>/proposals.json --dashboard-copy dashboard/public/data/proposals/harvest-playground-c<N>.json`
   (omit `--carry` if that file doesn't exist). Refine interpretations/risk in the JSON if needed. Write back Pending labels
   (`proposals.py writeback-js --proposals … --doc-id <DOC>` → `lucid_run_script`), commit the proposals + dashboard copy
   (message `Harvest <date> cycle <N>: proposals (waiting for approval)`), deploy the dashboard. **Do not touch `site/`, open
   PRs, merge, capture or build cycle N+1.** Log the run as `outcome: "waiting_approval"` in `nightlyHarvests`.
2. Report to John in Grok Bot chat: the output of `proposals.py summary --proposals journey/cycles/<N>/proposals.json`
   (numbered, with risk, author and proposed change, plus the dashboard cycle link) and wait. Nothing else happens until he replies.
3. John replies per item, e.g. `1 approve, 2 reject, 3 defer, 4 approve: make it 20% larger`. Record it:
   `proposals.py decide --proposals … --dashboard-copy … 1=approve 2=reject 3=defer "4=approve:make it 20% larger"`.
   Items he didn't mention stay pending (ask once more, or carry them over).
4. Apply: `proposals.py apply --proposals … --plan journey/cycles/<N>/apply-plan.json` and implement **only** the items in the
   plan, following steps 3–8 of the nightly procedure (safety rules still apply; rejected → skipped `rejected by reviewer`,
   deferred → listed in CHANGELOG as deferred). After the merge: `proposals.py mark-applied --proposals … --dashboard-copy … --commit <sha>`,
   write back Approved→Applied/Rejected/Deferred labels on the cycle N board, commit, deploy.
5. The next cycle's propose uses `--carry journey/cycles/<N>/proposals.json` so deferred and unreviewed items come back.
In `auto` mode the run may also write back Applied/Skipped labels after the merge:
`proposals.py writeback-js --feedback journey/cycles/<N>/feedback.json --auto-applied <itemId,…>` → `lucid_run_script` on the board.
Helper docs: `journey/harvest/README.md`. Dry run (fake stickies, scratch board): `journey/harvest/dryrun/`.

## Board rules (review boards)
- **Always Lucidchart:** create every harvest review board with `product: "lucidchart"` (Standard Import / MCP create
  tools). Never create Lucidspark documents for harvest boards. (Cycles 0–4 were Lucidspark; they stay as they are.)
- **Never create a Lucid "Hub" board.** The dashboard is the hub: each cycle's documents are listed on its cycle page.
  Existing hub docs are left in Lucid untouched but are no longer listed anywhere.
- **Sticky authors on:** every review board's legend says “Stickies show your name — leave yours signed in” and the
  board gets an org-wide comment share link (`commentUrl`, created when the board is created; dashboard shows an "Open board to comment" button, no embeds) and is shared to reviewers as named (signed-in) collaborators, so each sticky carries Lucid's author attribution.
  See § Sticky authors for how the harvest reads it.

## Sticky authors
How Lucid exposes authorship (investigated via the Lucid MCP on 2026-10-12, Cycle 4 board):
- **Stickies:** Lucid sticky notes (`StickiesStickyNoteBlock`) carry a read-only attribution text area
  (`ReadonlyAttributionText`, e.g. "  John Dilworth") when sticky authorship is shown; `fetch` returns it in
  `TextAreas` or as the `"<text>;   <author>"` label suffix. `journey/harvest/harvest.py` already strips it from the
  feedback text and stores it as `author` on each item.
- **Comments:** `list_document_threads` / `list_document_thread_comments` return each comment with its author.
- **Not available:** the Script API (`lucid_get_script_catalog`) has no per-block creator field;
  `secondarycanvasediting.getDocumentHistory` returns actions without user identity; only `blockannotations`
  reactions list collaborator display names. So authorship is only as good as the sticky's attribution line: stickies
  made by anonymous/link viewers, pasted or imported, or created with attribution hidden have none.
Harvest rule: record `author` per item (sticky attribution, else comment author, else a trailing `— Name` signature,
else **`anonymous`**). Include authors in the CHANGELOG entry (`… · by <author>` on each applied/skipped item plus an
`### Authors` line with counts) and in the HISTORY day entry, and write per-cycle counts to `harvest.json` `authors`.

## Deploys
- **Continuous deploy:** the Netlify site `harvest-playground` (id `4702dcbf-e724-4e32-b35c-739e1fdf7ae5`) is linked
  to this repo; every push to `main` deploys production from `site/`.
- **Fallback (CLI)** if the Git link ever breaks, with `NETLIFY_AUTH_TOKEN` in the environment:
  `netlify deploy --prod --dir=site --site 4702dcbf-e724-4e32-b35c-739e1fdf7ae5 --message "cycle N"`

## Dashboard (this is the hub)
- **Site:** https://harvest-dashboard.netlify.app (Netlify site `harvest-dashboard`, id `6f658653-21cc-4b1a-8094-b890bd04ef18`).
  Source lives in `dashboard/` (separate from `site/`, so stickies never touch it). Not Git-linked: deploy with
  `cd dashboard && netlify deploy --prod --dir=public --functions=netlify/functions --site 6f658653-21cc-4b1a-8094-b890bd04ef18`.
- **Multi-project (v4, 2026-10-12).** Pages: `/` lists every Harvest project as a card; `/p/<slug>/` project dashboard,
  `/p/<slug>/cycle.html?c=<N>` per cycle, `/p/<slug>/summary.html` all cycles (one set of templates, `project*.html`, served
  via rewrites in `dashboard/netlify.toml`; the slug is read from the path). Legacy `/cycle.html?c=N`, `/summary.html` and
  `/harvest.json` 301 to the Harvest Playground equivalents. Noindex (header + meta + robots.txt).
- **Data:** `dashboard/public/data/projects.json` (index: slug, name, file, harvestMode) + one file per project
  `dashboard/public/data/<slug>.json` (schemaVersion 3 = v2 below plus `project.harvestMode` `"nightly"|"manual"`,
  `project.trigger` bool, `stats.manualHarvests`, per-cycle `manualHarvests[]` (same shape as `nightlyHarvests`), optional
  `authorsNote`, `screens`, `historyBoardLabel`). Manual projects show "Manual harvests" instead of "Nightly harvests".
  Projects today: `harvest-playground` (nightly), `design-loop`, `harvest-site`, `harvest-dashboard` (manual).
  `dashboard/build_projects.py` was a one-time seed; edit the data files directly afterwards.
- **Nightly step 8:** update `dashboard/public/data/harvest-playground.json` (formerly `harvest.json`) (append a `nightlyHarvests` entry to the current cycle; on a new cycle mark the
  old one archived (`"status":"superseded"`, UI **Archived**), append the new cycle with `"status":"current"`, bump `stats.pullRequests` if a PR was opened,
  bump `stats.nightlyHarvests`, set `updatedAt`), commit, then run the deploy command above. Also:
  - add every Lucid board of the new cycle to its `documents` (role `flow`; never a `hub` entry);
  - add/refresh the harvested cycle's `authors` (§ Sticky authors) — counts per author of every harvested sticky;
  - set the new cycle's `previewUrl` to the Netlify deploy permalink of its commit:
    `GET https://api.netlify.com/api/v1/sites/4702dcbf-e724-4e32-b35c-739e1fdf7ae5/deploys` → the `ready`
    production deploy whose `commit_ref` starts with the cycle's `commit` (else the closest one after `createdAt`),
    URL `https://<deploy_id>--harvest-playground.netlify.app`. Omit `previewUrl` (and say so) if none matches.

### harvest.json schema (schemaVersion 2)
```
{
  "schemaVersion": 2,
  "project": { "name", "slug", "description", "repo", "site", "historyBoard", "schedule", "rules" },   // URLs as strings
  "stats": { "pullRequests": int, "pullRequestsSource": str, "nightlyHarvests": int },
  "updatedAt": ISO-8601 with offset,
  "cycles": [ {
    "number": int, "title": str, "createdAt": ISO-8601, "status": "current" | "superseded"  // UI label for superseded is "Archived",
    "harvestedFrom": int|null, "pullRequest": url|null, "commit": short sha, "screenshot": url,
    "previewUrl"?: url,       // Netlify deploy permalink https://<deploy_id>--harvest-playground.netlify.app for `commit`
    "documents": [ { "title", "role": "flow", "flow"?: "home"|"dinosaur"|"random"|"review"|…,
                     "docId", "url", "commentUrl", "description", "harvest"?: bool } ],      // one per Lucid doc; no "hub" role (v2)
    "authors": [ { "name": str, "stickies": int } ],   // stickies harvested from THIS cycle's boards, per author;
                                                       // unknown author = "anonymous"; [] when none yet
    "nightlyHarvests": [ { "date": "YYYY-MM-DD", "stickies": int, "outcome": "applied"|"no_stickies"|"failed" } ],
    "changes": { "applied":  [ { "priority": "must"|"try"|"consider", "flow", "text" } ],
                 "skipped":  [ { "text", "reason" } ],     // reason per § Skipped items, e.g. "empty", "unsafe: malicious"
                 "conflicts": [ str ], "hubStrays"?: [ str ], "note"?: str },
    "contributions": { "red": int, "yellow": int, "blue": int, "purple": int }
        // stickies that produced THIS cycle's changes (applied + skipped), by type: red = Must do, yellow = Try,
        // blue = Consider, purple = Board feedback (purple / `Board:` stickies on the harvested flow boards; hub strays
        // excluded). Skipped stickies count under their colour/keyword. All four keys always present (0 if none).
  } ]
}
```
Cycle stats (count, applied, skipped, authors) are computed from `cycles`; the dashboard lists the `current` cycle first.
Cycle pages show Previous/Next links (when those cycles exist), the Preview link, Lucid documents, changes, sticky
authors, and Nightly harvests; the summary page shows authors per cycle and totals.
`contributions` (added 2026-10-12, still schemaVersion 2): **every nightly or manual harvest that creates a new cycle
must write it** for that cycle (a new cycle with no stickies gets all zeros). It drives the dashboard histogram
(one stacked bar per cycle). If missing, the dashboard derives red/yellow/blue from `changes` priorities (purple = 0).
v1 → v2 (2026-10-12): hub documents removed from every cycle, `previewUrl` and `authors` added.

### "Run harvest now" trigger
The button lives **only on the current cycle's page**, inside its "Nightly harvests" section (not on the project
dashboard, not on older cycles). It opens a modal: passphrase + type `RUN`, then shows success or the error.
`dashboard/netlify/functions/trigger.mjs` (`/api/trigger`). GET returns `{configured}`; the button is disabled unless
both env vars below are set on the harvest-dashboard site. POST `{project, secret, confirm}` needs the shared secret plus typing `RUN`, then forwards
`POST {project, action:"harvest", source, requestedAt}` with `Authorization: $HARVEST_WEBHOOK_AUTH` to the webhook.
The button shows only on projects whose data file has `project.trigger: true`; the function allowlists
`harvest-playground` and `harvest-dashboard` (the webhook routine must branch on `project`).
- `HARVEST_TRIGGER_URL`: webhook that starts the harvest routine (it must run the nightly procedure and create cycle N+1).
- `HARVEST_TRIGGER_SECRET`: shared secret typed by the user (checked in the function).
- `HARVEST_WEBHOOK_AUTH`: Authorization header value sent to the webhook.

## Screen captures (hosting)
- **Host:** the dashboard site serves every Harvest screen capture at
  `https://harvest-dashboard.netlify.app/captures/<project>/<flow-slug>/<file>.png` (source
  `dashboard/public/captures/`, deployed with the dashboard deploy command). `<flow-slug>` is `c<N>-<flow>` (e.g.
  `design-loop/c5-landing/`, `harvest-playground/c4-home/`). Stable filenames (`01-….png`) so re-captures overwrite.
- 2026-10-12: all 42 folders of journey-assets-ai-xform were copied here (prefix `design-loop-`, `harvest-playground-`,
  `harvest-site-` → `/captures/<project>/<rest>/`; non-project folders under `/captures/legacy/`). **journey-assets-ai-xform
  (id 072e8f44-…) stays live and unchanged** so existing Lucid boards keep loading; never publish new captures there.
- Watch the deploy size (`du -sh dashboard/public/captures`, ~33 MB on 2026-10-12); keep single files under 2 MB.

## Harvest Dashboard project (manual)
The dashboard itself is a Harvest project (`harvest-dashboard`). There is **no nightly routine**; a harvest runs only when
someone presses **Run harvest now** on its current cycle page (`/p/harvest-dashboard/cycle.html?c=<N>`), which posts
`{project:"harvest-dashboard", action:"harvest", …}` to the webhook. The routine for that payload:
1. Read `dashboard/board/c<N>/lucid-doc.json`; fetch every `harvest:true` board (Lucid `fetch`, threads, comments) into
   `dashboard/board/c<N>/raw/`, and classify with `journey/harvest/harvest.py` exactly as in the nightly procedure
   (priority words/colours, purple = board feedback, authors).
2. **Repo = this repo's `dashboard/` folder** (never `site/`). Apply every safe item per § What counts as safe, with
   extra limits: keep `netlify/functions/trigger.mjs` auth logic and the env vars (`HARVEST_TRIGGER_URL`,
   `HARVEST_WEBHOOK_AUTH`, `HARVEST_TRIGGER_SECRET`) unchanged, keep noindex, the legacy redirects, `/captures/`, and every
   project's data. Skip malicious, illegal or offensive items (and anything that would remove projects/data, expose
   secrets, or break the trigger) with a reason; newest wins on conflicts. Log applied/skipped in the data file.
3. Commit to `main` (message `Harvest Dashboard cycle <N+1>: …`), push, and deploy with the dashboard deploy command.
4. Capture cycle N+1: `cd journey && cp ../dashboard/shoot.mjs _shoot.mjs && node _shoot.mjs https://harvest-dashboard.netlify.app
   ../dashboard/public/captures/harvest-dashboard/c<N+1>-review "" review` (home, project dashboard, cycle page, Run
   harvest modal, summary; add screens if the dashboard grew new pages). Since cycle 3 also capture the meeting pages
   (`node _shoot.mjs https://harvest-dashboard.netlify.app ../dashboard/public/captures/harvest-dashboard/c<N+1>-meetings "" meetings`:
   meetings series page + current meeting page) for a separate **Meetings** board (`build_board.py <N+1> <sha> meetings`), and
   re-capture the New project flow (`journey/shoot-c3-new.mjs`) when the form changed. Then redeploy so the captures are public.
5. Build the board: `cd dashboard/board && python3 build_board.py <N+1> <sha> > c<N+1>/lucid-spec.json`; import as
   **Lucidchart** (`use_assisted_layout:false`), set the page background `#E8EAED` (`skills.pages.setBackgroundColor`),
   export every page to verify the images render (`c<N+1>/export-p1.png`), write `c<N+1>/lucid-doc.json`. Create the org-wide
   comment share link (`lucid_create_document_share_link`: role `comment`, `restrict_to_account:true`, `allow_anonymous:false`, no expiry) and keep its acceptUrl as `commentUrl`. One board unless
   a flow has more than 5 screens; no hub.
6. Update `dashboard/public/data/harvest-dashboard.json`: mark cycle N archived (`superseded`), add its `manualHarvests` entry and
   `authors`; append cycle N+1 (`current`, `harvestedFrom` N, `commit`, `documents`, `contributions` (each document with `commentUrl`), `changes` with
   applied/skipped reasons, `previewUrl` = production deploy permalink `https://<deploy_id>--harvest-dashboard.netlify.app`
   of that commit); bump `stats.manualHarvests`, set `updatedAt`; commit, push, deploy.

> Note (2026-10-12): `dashboard/public/captures/` is committed to git (backed up and versioned with each cycle). Commit new captures with each harvest. If the repo grows too large, move them to Git LFS or a separate captures repo.

## New project setup

Started from the dashboard's **New project** form (`/new.html`, passphrase + typed `CREATE`). The `trigger` function validates the form server-side (whitelisted fields, length limits, body ≤ 32 KB) and POSTs to `HARVEST_TRIGGER_URL` (header `Authorization: HARVEST_WEBHOOK_AUTH`):

```json
{ "action": "create-project", "project": "<slug>", "source": "harvest-dashboard", "requestedAt": "<ISO>",
  "setup": { "name", "slug", "description",
    "repo": {"mode":"existing","fullName":"owner/name"} | {"mode":"new","name":"repo-name"},
    "branch", "baseDir", "buildCommand", "publishDir", "liveUrl",
    "netlify": {"mode":"new"|"existing","site"?:"name-or-id","deployPreviews":true},
    "startUrls": ["/", "..."], "flowsText": "natural-language description of each flow to capture (max 4000 chars)",
    "schedule": {"mode":"manual"} | {"mode":"daily","time":"HH:MM","timezone":"America/Denver"} | {"mode":"weekly","time":"HH:MM","days":["mon","tue",…],"timezone":"America/Denver"} | {"mode":"nightly","time":"HH:MM","timezone":"America/Denver","weekends":false},
    "mergePolicy": "auto-merge-safe" | "pr-approval", "reviewers": ["email"], "notify": "John via Grok Bot chat" } }
```

The setup run must:

1. **Repo** — link the existing `owner/name` repo, or create `johndilworth/<name>` (default branch as given). Record base dir, build command and publish dir.
2. **Netlify** — link the named site, or create a new one (default) wired to the repo/branch/base/build/publish settings; enable PR deploy previews if requested. The live URL to capture is `liveUrl` if given, else the Netlify site URL after the first deploy.
3. **Dashboard data** — add an entry to `dashboard/public/data/projects.json` (`slug`, `name`, `file`, `harvestMode`) and create `dashboard/public/data/<slug>.json` (project info incl. repo, site, schedule, merge policy, reviewers).
4. **Cycle 0 captures** — capture every start URL and each flow described in `flowsText` (read the plain-language description, work out the start path and the steps, and capture each screen; the legacy structured `flows` array is still accepted) to `dashboard/public/captures/<slug>/<flow>/` (tracked in git).
5. **Lucidchart review board(s)** — follow the board rules: one board per flow, a flow with more than 5 screens is split into separate boards, **no hub board**.
6. **Share** the board(s): create an org-wide comment share link per board (`lucid_create_document_share_link`, role `comment`, restricted to account, not anonymous, no expiry) and store it as `commentUrl` in the project data file; no embeds. Also share with the reviewers (edit/comment) as needed. Remind them that stickies show their author only when they are signed in to Lucid.
7. **Record Cycle 0** in `<slug>.json` (boards, screenshots, status `current`).
8. **Redeploy the dashboard** (`cd dashboard && netlify deploy --prod --dir=public --functions=netlify/functions --site 6f658653-21cc-4b1a-8094-b890bd04ef18`) so the project appears on the home page; to allow "Run harvest now" on it, add the slug to `PROJECTS` in `trigger.mjs`.
9. **Schedule** — Manual: nothing more. Nightly: a routine must be created to run the harvest at the chosen time (MT), weekdays only unless weekends is on.
10. **Merge policy** — store it; harvests then either auto-apply & merge safe items or open a PR for approval.
11. **Notify** — send the result (links to dashboard, site, boards) to John in Grok Bot chat.

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
