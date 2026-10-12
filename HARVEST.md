# Harvest rules (nightly)

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
6. Host the images on journey-assets-ai-xform under `/harvest-playground-c<N+1>-home/` (copy into
   `/workspace/journey-assets-site/harvest-playground-c<N+1>-home/`, then
   `netlify deploy --prod --dir=/workspace/journey-assets-site --site 072e8f44-b0a5-4b41-a9bb-bcbc8dd4eb92`).
7. Build the next cycle review board(s) **as Lucidchart documents** (`product: "lucidchart"`, never Lucidspark) per
   § Board rules (single-page imports; keep screens on one board until a section has more than 5 flows or screens, then
   split; **no hub board**; rules from the prototype-to-lucid-journey-map skill including page background #E8EAED with
   frames #F2F3F5, extra-roomy frames, sticky-author line in the review legend). Export every board to verify, and save
   `journey/cycles/<N+1>/` (`lucid-doc.json` with `boards[]` only, specs, manifest).
8. Update the dashboard (§ Dashboard, nightly step 8) — it is the hub: every board of the new cycle goes into that
   cycle's `documents`, plus `previewUrl` and `authors`.

## Board rules (review boards)
- **Always Lucidchart:** create every harvest review board with `product: "lucidchart"` (Standard Import / MCP create
  tools). Never create Lucidspark documents for harvest boards. (Cycles 0–4 were Lucidspark; they stay as they are.)
- **Never create a Lucid "Hub" board.** The dashboard is the hub: each cycle's documents are listed on its cycle page.
  Existing hub docs are left in Lucid untouched but are no longer listed anywhere.
- **Sticky authors on:** every review board's legend says “Stickies show your name — leave yours signed in” and the
  board is shared to reviewers as named (signed-in) collaborators, so each sticky carries Lucid's author attribution.
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
- Pages: `/` dashboard, `/cycle.html?c=<N>` per cycle, `/summary.html` all cycles. All render client-side from
  `dashboard/public/harvest.json`, the single data file. Noindex (header + meta + robots.txt).
- **Nightly step 8:** update `harvest.json` (append a `nightlyHarvests` entry to the current cycle; on a new cycle mark the
  old one `"superseded"`, append the new cycle with `"status":"current"`, bump `stats.pullRequests` if a PR was opened,
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
    "number": int, "title": str, "createdAt": ISO-8601, "status": "current" | "superseded",
    "harvestedFrom": int|null, "pullRequest": url|null, "commit": short sha, "screenshot": url,
    "previewUrl"?: url,       // Netlify deploy permalink https://<deploy_id>--harvest-playground.netlify.app for `commit`
    "documents": [ { "title", "role": "flow", "flow"?: "home"|"dinosaur"|"random"|"review"|…,
                     "docId", "url", "description", "harvest"?: bool } ],      // one per Lucid doc; no "hub" role (v2)
    "authors": [ { "name": str, "stickies": int } ],   // stickies harvested from THIS cycle's boards, per author;
                                                       // unknown author = "anonymous"; [] when none yet
    "nightlyHarvests": [ { "date": "YYYY-MM-DD", "stickies": int, "outcome": "applied"|"no_stickies"|"failed" } ],
    "changes": { "applied":  [ { "priority": "must"|"try"|"consider", "flow", "text" } ],
                 "skipped":  [ { "text", "reason" } ],     // reason per § Skipped items, e.g. "empty", "unsafe: malicious"
                 "conflicts": [ str ], "hubStrays"?: [ str ], "note"?: str }
  } ]
}
```
Cycle stats (count, applied, skipped, authors) are computed from `cycles`; the dashboard lists the `current` cycle first.
Cycle pages show Previous/Next links (when those cycles exist), the Preview link, Lucid documents, changes, sticky
authors, and Nightly harvests; the summary page shows authors per cycle and totals.
v1 → v2 (2026-10-12): hub documents removed from every cycle, `previewUrl` and `authors` added.

### "Run harvest now" trigger
The button lives **only on the current cycle's page**, inside its "Nightly harvests" section (not on the project
dashboard, not on older cycles). It opens a modal: passphrase + type `RUN`, then shows success or the error.
`dashboard/netlify/functions/trigger.mjs` (`/api/trigger`). GET returns `{configured}`; the button is disabled unless
both env vars below are set on the harvest-dashboard site. POST needs the shared secret plus typing `RUN`, then forwards
`POST {project, action:"harvest", source, requestedAt}` with header `x-harvest-secret` to the webhook.
- `HARVEST_TRIGGER_URL`: webhook that starts the harvest routine (it must run the nightly procedure and create cycle N+1).
- `HARVEST_TRIGGER_SECRET`: shared secret typed by the user and sent to the webhook for verification.
