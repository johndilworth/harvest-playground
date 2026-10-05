# Harvest rules (nightly)

The playground grows one Harvest cycle per day. Anyone on the team can ask for anything by leaving a sticky
on the current cycle's flow board in Lucid.

## Schedule
- **5:00 pm MT (America/Denver) daily:** stickies on the current cycle's flow board(s) are harvested.
- Every **safe** item is applied automatically to `site/`, committed, and merged to `main`.
  Netlify deploys `main` to production automatically.
- By the next morning a new cycle board (flow board + hub) exists for cycle N+1.

## What gets harvested
- Only stickies **inside a review frame** on a flow board listed in `journey/cycles/<N>/lucid-doc.json`
  (`boards[]` with `"harvest": true`). The hub is never harvested.
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
7. Build the next cycle boards and hub "Harvest Playground — Cycle N+1 · Hub"
   (single-page imports; keep screens on one board until a section has more than 5 flows or screens, then split;
   hub still links every board; board rules from the prototype-to-lucid-journey-map skill including page
   background #E8EAED with frames #F2F3F5, extra-roomy frames). Export every board to verify, and save
   `journey/cycles/<N+1>/` (`lucid-doc.json`, specs, manifest).

## Deploys
- **Continuous deploy:** the Netlify site `harvest-playground` (id `4702dcbf-e724-4e32-b35c-739e1fdf7ae5`) is linked
  to this repo; every push to `main` deploys production from `site/`.
- **Fallback (CLI)** if the Git link ever breaks, with `NETLIFY_AUTH_TOKEN` in the environment:
  `netlify deploy --prod --dir=site --site 4702dcbf-e724-4e32-b35c-739e1fdf7ae5 --message "cycle N"`
