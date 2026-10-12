# Changelog

One entry per Harvest cycle. Each entry lists applied items, skipped items (with reason), conflicts, and board feedback.

## Cycle 5 (2026-10-12) · nightly harvest
Nightly 5 pm MT harvest of the Cycle 4 review board `7e1a1751-68e6-4551-8845-64cc394e748a` (Home · Dino Town · Totally Random) —
**12 stickies, 0 comment threads** (11 in-frame with text, 1 empty). No priority keywords, so sticky colour decided
priority (red = must, yellow = try, blue = consider). Authors from Lucid sticky attribution.

### Applied (11)
- **must** · Home · “Make the background black on this page, to match other pages on site.” → `purple-bg` removed from the Home `<body>`, so Home uses the same near-black terminal background as Dino and Random. · by John Dilworth
- **must** · Home · “Left align the text in this black frame” → SPIRAL.φ panel heading and copy left-aligned (was centred). · by Jilea Fobair
- **must** · Random · “fix the rotation of the text in this header section to match the other header sections” → RANDOM.LOG header no longer rotated (−3° removed). · by Jilea Fobair
- **try** · Home · “Let's turn this into a gallery where you can cycle and click through several different artwork using the same overview and caption” → SPIRAL.φ is now a 4-artwork golden-spiral gallery (Mona Lisa, Hokusai’s Great Wave, Vermeer’s Girl with a Pearl Earring, Gleizes’s Les Baigneuses) with Prev/Next, dots, arrow keys and click-to-advance; one shared overview, same caption format per slide. Spiral overlays for Hokusai and Vermeer drawn for this cycle (paintings public domain). · by Rob Witt
- **try** · Dino · “allow three tiles to span per row on wider screens” → Hall of Fame grid is 3 columns at ≥1200 px (page widened to 1180 px there); 2 columns below, 1 on phones. · by Jilea Fobair
- **try** · Random · “the numbered list needs to be indented to match the alignment of the other text in this section.” → numbered lists now start flush with the paragraph text (counter markers, hanging indent for wrapped lines), site-wide. · by Jilea Fobair
- **try** · Random · “change the written data in this Meter section to have a data visualzion per topic” → METER is a bar chart (Socks 3, Wombat cubes 4, McLuhan 1, Spirals 2, Layout chaos 1; scale 0–5). · by Jilea Fobair
- **consider** · Dino · “consider updating this photo to be a daytime instead of a night time photo to match other tiles” → Quarry Stegosaurus photo swapped for a daytime shot (Jens Lallensack, CC BY-SA 4.0, `site/assets/c5/dino-stegosaurus-dnm-day.jpg`). · by Jilea Fobair
- **consider** · Dino · “Include a button on each tile that users can click to hear an audio clip of the dinosaur’s roar” → ▶ ROAR.WAV button on all six tiles; roars are synthesized in the browser with the Web Audio API (first-party `assets/c5/playground.js`, no audio files or third-party code). · by Jilea Fobair
- **consider** · Random · “Animate this "Enhance, Obsolesce, et..." visual to help people understand the optimal flow” → the tetrad ASCII diagram is now an animated loop: the highlight walks Enhance → Obsolesce → Retrieve → Reverse (respects reduced-motion). · by Jilea Fobair
- **consider** · Random (top nav) · “When top tab is clicked to the right of the already selected top tab, animate the fill color in from left to right. When … to the left …, from the right to the left.” → nav tabs on every page: the newly active tab’s green fill slides in from the side of the tab you came from. · by Jilea Fobair

### Skipped (1)
- “(empty sticky)” on Home — `empty` (needs intent) · by John Dilworth
- No malicious, illegal or offensive stickies.

### Conflicts
- none

### Board feedback (purple / Board:)
- none

### Authors
- Jilea Fobair — 9 · John Dilworth — 2 · Rob Witt — 1

Commit `b07b10d` · preview https://6acd6b3d4cad2bdcce665143--harvest-playground.netlify.app · Cycle 5 board: [review (Lucidchart)](https://lucid.app/lucidchart/336cb099-c6d5-44da-bb6e-e883893de039/edit) · no PR (fast-forward merge)
Record: `journey/cycles/4/feedback-2026-10-12.json` + `journey/cycles/4/harvest-2026-10-12.json` · raw board fetch in `journey/out/c4/raw/` (gitignored).

## Harvest Dashboard · Cycle 2 (2026-10-12) · manual harvest
Manual harvest triggered from the Harvest Dashboard webhook (`action:harvest` / `project:harvest-dashboard`).
Harvested Cycle 1 boards: review `090db6e7-…` + New project `074fcea1-…` —
**6 stickies** (all in-frame on review; 0 on New project), all safe. Authors: none on stickies → **anonymous**.

### Applied (6)
- **must** · 01-home · Change page title from "Harvest projects" to "All projects" to match menu option above. · by anonymous
- **must** · 02-project-dashboard · Do: remove project name from top header. This will only be for global navigation items. do this on all pages. · by anonymous
- **try** · 03-cycle · Change title from "Cycle 0" to "[Project name] · Cycle [0]" — project name is a breadcrumb link back to the project dashboard. · by anonymous
- **try** · 05-summary · Remove "History" from navigation; this navigation should be a component used on all pages so navigation is not duplicated. · by anonymous
- **try** · 05-summary · Move the navigation links (Dashboard, Summary, Live site) to the right of the page title. · by anonymous
- **try** · 05-summary · Change title from "Summary of all cycles" to "[Project name] · Summary". · by anonymous

### Skipped (0)
- none

### Conflicts
- none

### Board feedback (purple / Board:)
- none

### Authors
- anonymous — 6

Commit `191461b` · preview https://6acd62d917ce9618cbc3ec9a--harvest-dashboard.netlify.app · Cycle 2 boards: [review](https://lucid.app/lucidchart/f04918ba-aee0-49b0-bb31-0a3c796b79d7/edit) · [New project](https://lucid.app/lucidchart/5ef85601-978c-4810-9cd3-f52ec629ca8e/edit)

## Harvest Dashboard · Cycle 1 (2026-10-12) · manual harvest
Manual harvest triggered from the Harvest Dashboard webhook at ~3:20 PM MT (payload
`action:harvest` / `project:harvest-dashboard` / `requestedAt:2026-10-12T21:20:19Z`).
Harvested Cycle 0 boards: review `6337bd96-…` + New project `ea0758f2-…` —
**13 stickies** (11 in-frame, 1 outside frame, 1 empty/needs intent), 0 comment threads.
Priority by sticky colour (no text keywords). Authors recorded from Lucid attribution.

### Applied (11)
- **must** · review · “Increase the number of projects that are displayed horizontally on the page - this could mean increasing the max width o…” · by John Dilworth
- **must** · review · “The elements in the header are actually specific to the project, so move them under the project title:

Dashboard (curre…” · by John Dilworth
- **must** · review · “Remove "Type RUN" to confirm. Since this is password only and not a descriptive action, the RUN confirmation isn't neces…” · by John Dilworth
- **must** · New project · “Add options for scheduling - a calendar with daily, weekly, or pick certain days of the week. like calendar events. 

an…” · by anonymous
- **try** · review · “Remove description under harvest projects - it's unecessary.” · by John Dilworth
- **try** · review · “Manual harvest should be available for all projects - it is not available on some projects” · by John Dilworth
- **try** · review · “Don't show the changes made or sticky authors if there are none to show.” · by John Dilworth
- **try** · review · “Under the "Lucid documents" section make the lucid document a board preview - embed code can look like this in html - wo…” · by John Dilworth
- **try** · review · “Don't include large screenshot here, only link to the cycle boards that use the Lucid embeds.” · by John Dilworth
- **try** · review · “Remove author section — author names appear next to summaries, and user can click into cycle board to see who left actua…” · by John Dilworth
- **try** · New project · “Make this wider on big screens - up to 5 tiles across” · by anonymous

### Skipped (2)
- “Lucid documents look like this in Lucid. Here's an SVG of the Lucidchart logo that can be used in a tile/preview” — `outside frame` · by John Dilworth
- “(empty sticky)” — `empty` · by anonymous

### Conflicts
- none

### Board feedback (purple / Board:)
- none

### Authors
- John Dilworth — 10
- anonymous — 3

Record: `dashboard/board/c0/feedback.json` · Cycle 1 boards: review `090db6e7-…`, New project `074fcea1-…`.

## Cycle 4 (2026-10-12) · manual dashboard harvest
Manual harvest triggered from the Harvest Dashboard webhook at ~10:30 AM MT (payload
`action:harvest` / `source:harvest-dashboard` / `requestedAt:2026-10-12T16:30:58.360Z`).
Harvested the Cycle 3 review board `a1ee016b-d2ff-41fd-be8d-61c1b55d2ef3` (Home · Dino Town · Totally Random) —
**9 stickies, 0 comment threads**. Hub stray: none. Priority: text keywords where present, else sticky colour.

### Applied (9)
- **must** · Home · “Do: Change site title to \"ENTROPY COLLECTIVE\"” → site title / `<title>` / H1 become **ENTROPY COLLECTIVE** across pages.
- **must** · Home · “Do: Give the whole site a new visual styles that's more retro tech… terminal aesthetic…” → site-wide **terminal mode** (`body.terminal-mode`): green-on-black panels, square frames, prompt lines, MOTD banner; headlines/copy rewritten in retro-tech voice.
- **must** · Dino · “Apply aesthteic changes to the dino page also.” → Dino Town gets the same terminal skin + square layout.
- **must** · Random · “Add a new fact - showing Marshall McCluhan's grave… 4 Laws of media.” → new `#c4-mcluhan` section with life blurb + tetrad (enhance / obsolesce / retrieve / reverse).
- **try** · Home · “Change heading and other fonts to use Share Tech Mono.” → Google Font **Share Tech Mono** on all pages (headings + body).
- **try** · Random · “Use this image.” → Lucid-uploaded McLuhan grave photo saved as `site/assets/c4/mcluhan-grave.png` (≈472 KB) and shown in the McLuhan section.
- **try** · Random · “Site pages with more terminal aesthetic won't have rotated titles, will be more square and techish.” → free-form rotations removed under `.terminal-grid`; panels are square, titles unrotated.
- **try** · Random · “Make these background images into random ASCII art…” → fixed SVG-tile ASCII background (`.ascii-bg`) behind all pages.
- **try** · Dino · “Keep the dino page — but change copy… dinosaurs extinction… modern tech… Ancient Aliens.” → new `#c4-extinction-tech` briefing with wild extinction↔tech analogies; Hall of Fame kept, copy tightened to terminal voice.

### Skipped
- none (no empty, unsafe, malicious, illegal or offensive stickies)

### Conflicts
- none (the terminal aesthetic stickies reinforce each other; newest-wins not needed)

### Board feedback (purple / Board:)
- none

### Authors
- anonymous — 9 (the Cycle 3 board was Lucidspark without sticky attribution; from Cycle 5 boards are Lucidchart with authors shown)

### Hub stray stickies
- none (Cycle 3 hub: generated shapes only, 0 threads)

Record: `journey/cycles/3/feedback-2026-10-12-manual.json` · harvest summary written with Cycle 4 docs.

## 2026-10-11 harvest (no Cycle 4) · Sunday polish
Harvested the Cycle 3 review board `a1ee016b-d2ff-41fd-be8d-61c1b55d2ef3` (Home · Dino Town · Totally Random) at ~5:02 pm MT —
**0 stickies, 0 comment threads**. Hub stray: none (Cycle 3 hub has only generated shapes, 0 threads).
No site changes; Cycle 3 remains live. Applied: none. Skipped: none. Conflicts: none. Board feedback: none.
Sunday polish: HISTORY.md + Lucid History board updated for Monday sharing (quiet-night tile for Sun 10-11; title totals 9 nightly harvests).
Record: `journey/cycles/3/harvest-2026-10-11.json`.

## 2026-10-10 harvest (no Cycle 4)
Harvested the Cycle 3 review board `a1ee016b-d2ff-41fd-be8d-61c1b55d2ef3` (Home · Dino Town · Totally Random) at ~5:05 pm MT —
**0 stickies, 0 comment threads**. Hub stray: none (Cycle 3 hub has only generated shapes, 0 threads).
No site changes; Cycle 3 remains live. Applied: none. Skipped: none. Conflicts: none. Board feedback: none.
Record: `journey/cycles/3/harvest-2026-10-10.json`.

## 2026-10-09 harvest (no Cycle 4)
Harvested the Cycle 3 review board `a1ee016b-d2ff-41fd-be8d-61c1b55d2ef3` (Home · Dino Town · Totally Random) at ~5:09 pm MT —
**0 stickies, 0 comment threads**. Hub stray: none (Cycle 3 hub has only generated shapes, 0 threads).
No site changes; Cycle 3 remains live. Applied: none. Skipped: none. Conflicts: none. Board feedback: none.
Note: the 2026-10-08 routine failed (no harvest); this run recovered from a clean Cycle 3 state.
Record: `journey/cycles/3/harvest-2026-10-09.json`.

## 2026-10-07 harvest (no Cycle 4)
Harvested the Cycle 3 review board `a1ee016b-d2ff-41fd-be8d-61c1b55d2ef3` (Home · Dino Town · Totally Random) at 5:10 pm MT —
**0 stickies, 0 comment threads**. Hub stray: none (Cycle 3 hub has only generated shapes, 0 threads).
No site changes; Cycle 3 remains live. Applied: none. Skipped: none. Conflicts: none. Board feedback: none.
Record: `journey/cycles/3/harvest-2026-10-07.json`.

## Cycle 3 (2026-10-06)
Harvested the Cycle 2 flow boards at 5:05 pm MT: Home `3d1704a5-0727-4aa0-9f05-d2609b1ac8fa` (2 stickies), Dinosaur
`1307df95-82cb-42ca-8fa5-0be7a2eba04b` (0) and Random `f206b6a4-74f6-4a19-87c4-8d843307a8c5` (0). That's **2 stickies**, both
inside the Home review frame, and 0 comment threads on any board. **Contributors:** neither sticky has a Lucid author line,
so they're credited as *anonymous (team)*. Priority came from the sticky colour (no sticky starts with a keyword).

### Applied (2)
- **must** · Home · *anonymous*: “change background to purple.” → the Home page background is now a deep **midnight purple**
  gradient (#1a0633 → #3b1170) with violet/pink glows, a purple nav bar and purple sticker cards (`body.purple-bg`). Dino Town
  and Totally Random keep midnight blue, because the sticky was on the Home board.
- **try** · Home · *anonymous*: “change this to golden sprial found in classical artwork” (placed on the *Official Spiral of
  Awesome* block) → the nautilus photo became the **golden spiral over Leonardo da Vinci's Mona Lisa**
  (`assets/photos/spiral-golden-mona-lisa.jpg`, 236 KB, Ellywa, CC BY-SA 4.0; painting public domain). The copy explains φ ≈ 1.618,
  and the header spiral badge now uses a crop of the same image (`spiral-golden-badge.jpg`). The Random page still reuses the
  nautilus.

### Skipped
- none (no empty, unsafe, malicious, illegal or offensive stickies)

### Conflicts
- “change background to purple.” (Cycle 2 board, newest) vs “Change overall design to a dark mode — midnight blue style
  instead of pinks.” (Cycle 1 board) → **purple applied** on Home (newest wins). It stays dark, so the rest of the midnight
  look (stars, gold/cyan accents) is kept.
- “change this to golden sprial found in classical artwork” (newest) vs “Photos instead of SVG drawings.” (Cycle 1) → no real
  clash: the golden spiral is a real image of a painting (not an SVG drawing). It replaces the Cycle 2 nautilus photo.

### Board feedback (purple / Board:)
- none on the Cycle 2 flow boards. The Cycle 3 board follows the 2026-10-05 rules: one review board (3 screens ≤ 5, so no split),
  page background #E8EAED, frames #F2F3F5.

### Hub stray stickies
- none (Cycle 2 hub had only generated shapes, no comment threads)

## Cycle 2 (2026-10-05)
Harvested the Cycle 1 flow boards at 5:12 pm MT: Home `73045fe0-c76b-4823-a6cf-105303b7b61a`, Dinosaur
`d20497d0-4de6-4546-ae1c-0b8519911f0b` and Random `32384a35-da3c-463c-a2c2-7c204d6e2a27`. That's **8 stickies** (all inside
review frames) and 0 comment threads. **Contributors:** none of the stickies has a Lucid author line, so they're credited
as *anonymous (team)*. Priority came from the sticky colour each time, because no sticky starts with a keyword
(`Do a new…` is not the `Do:` keyword).

### Applied (8)
- **must** · Random · *anonymous*: “Do a new random fact - make the layout even more random too.” → new section `#c2-wombat-cubes`
  (wombats poop cubes, 2019 Ig Nobel Prize in Physics), a “Randomness meter” block, and a chaos layout with big rotations
  (−8° to +9°), off-grid offsets and floating emoji.
- **try** · Home · *anonymous*: “Change overall design to a dark mode — midnight blue style instead of pinks.” → site-wide
  **midnight mode**: a deep-navy gradient, starfield, gold and cyan accents (no pinks), and a glowing Monoton headline.
- **try** · Home · *anonymous*: “Layout is too rigid, implement more of a free form layout, things can be anywhere on the page
  and emphasize the rotations even more.” → `main#sections.freeform` is now a 12-column free-form canvas. Blocks sit at odd
  offsets, rotations go up to ±5° and floating moon, star and planet stickers are added. It stacks on narrow screens.
- **try** · Home · *anonymous*: “Change this to a photographic image of a real turtle” → real Aldabra giant tortoise photo
  (`assets/photos/turtle-real.jpg`, NorbertNagel, CC BY-SA 4.0).
- **try** · Home · *anonymous*: “PHotos instead of SVG drawings.” → all SVG drawings were replaced with credited Wikimedia
  Commons photos. The couch-corner sketches became 3 photos (plant corner, reading nook, cat bed). The spiral hero and
  header badge became a nautilus shell photo, which the Random page reuses too.
- **try** · Dinosaur · *anonymous*: “Implement dark midnight mode as on on home page, and even more playful, random layout.”
  → midnight mode plus a scattered, rotated “Roadside Dino Hall of Fame” layout.
- **try** · Dinosaur · *anonymous*: “Add more roadside dinosaurs here — look up photos from the internet and add 5 or 6 of these
  with their story. Go into more depth and find out who made these dinosoaurs and give me a bio” → new section
  `#c2-roadside-dinos` with 6 dinosaurs, each with a story, a creator bio and a credited photo:
  Cabazon's Dinny & Mr. Rex (Claude K. Bell), Dinosaur Park in Rapid City (Emmet Sullivan), the Wall Drug Apatosaurus
  (Emmet Sullivan), Dinosaur Land in Virginia (James Q. Sidwell and Mark Cline), the World's Fair T. rex in Glen Rose, TX
  (Louis Paul Jonas) and the Quarry Stegosaurus at Dinosaur National Monument (Louis Paul Jonas). The photos are downloaded
  and hosted locally (each ≤ 162 KB), not hotlinked.
- **try** · Random · *anonymous*: “add new color scheme as suggested for other layouts.” → midnight mode on the Random page.

### Skipped (0)
- none. No empty, unsafe, malicious, illegal or offensive stickies, nothing outside a frame and nothing infeasible.

### Conflicts (3, newest wins, older Cycle 0 requests superseded)
- Cycle 0 “Make this page look a little like something designed by 10 year old children…” and its bright pink palette
  **vs** Cycle 1 “Change overall design to a dark mode — midnight blue style instead of pinks.” → applied the newer one:
  midnight mode. The childish 90s spirit (Comic Neue, marquee, blink, stickers) stays, because the new sticky only asks
  to change the colours.
- Cycle 0 “Do: Show examples in a hand sketched style of these awkward corner ideas.” **vs** Cycle 1 “PHotos instead of SVG
  drawings.” → applied the newer one: photos replace the sketches.
- Cycle 0 “A picture of a turtle wearing a cap would be fantastic also.” **vs** Cycle 1 “Change this to a photographic image of
  a real turtle” → applied the newer one: a real tortoise photo, so there's no cap.
- (The Cycle 0 “Use this spiral shape i drew, but design it really neat” drawing also became a photo under “Photos instead of
  SVG drawings”. A nautilus shell photo keeps the spiral idea.)

### Board feedback (purple / Board:) on the flow boards
- none

### Hub stray stickies (hub is never harvested, so these are not applied)
- Purple sticky on the Cycle 1 hub (`czGAvH8wUUQT`, *anonymous*): “background of pages should be slightly darker gray than frames”
- Purple sticky on the Cycle 1 hub (`pzGAdkk5SHVl`, *anonymous*): “May be unencessary to to have this split into multilple files
  when it's only one page, the harvest doc can be a sile Lucidhchart doc — only split if one section has more than 5
  individual flows or screens”. This contradicts the standing approved rule of one Lucid board per flow plus a hub, so it
  needs John's decision.
- One empty purple rectangle shape (`1yGA_.QKHkri`, not a sticky, no text) near the hub legend.

### Tooling
- `journey/harvest/harvest.py`: `caption-`, `shot-`, `thumb-`, `text-hub-` and `history-` ids now count as generated, so frame
  captions are no longer harvested as feedback.
- `journey/capture.mjs`: `--all yes` also captures the Dinosaur and Random pages.

## 2026-10-04 harvest (no Cycle 2)
Harvested Cycle 1 boards Home / Dinosaur / Random at 5:07 pm MT — **0 stickies, 0 comment threads**. Hub stray: none.
No site changes; Cycle 1 remains live. Applied: none. Skipped: none. Conflicts: none. Board feedback: none.
Record: `journey/cycles/1/harvest-2026-10-04.json`.

## 2026-10-03 harvest (no Cycle 2)
Harvested Cycle 1 boards Home / Dinosaur / Random — **0 stickies**. Hub stray: none. No site changes. Cycle 1 remains live.

## Cycle 1 (2026-10-02)
Harvested Cycle 0 board `de6b75aa-0b51-49a1-a9e9-561e4b77d675`. Contributors: (no Lucid attribution lines on stickies — anonymous / team).

### Applied (12)
- **must** Put a medium length paragraph with facts about longevity of turtles on this page. → section `#c1-turtle-longevity`
- **must** Do: Show examples in a hand sketched style of these awkward corner ideas. → `assets/couch-corners.svg` sketches
- **must** Change the headline font to Monoton → Google Fonts Monoton on all pages
- **must** A picture of a turtle wearing a cap would be fantastic also. → `assets/turtle-cap.svg`
- **must** Add a second page that's totally random about something else → `random.html` (sock vanishing)
- **must** Do: Resist the urge to make this look like a corporate website - it should not be boring. → scrapbook / sticker / dashed-border layout
- **try** Add new page with the history and origin of this dinosaur sculpture in Dinosaur Colorado. → `dinosaur.html` + hosted board photo
- **try** give me ideas about what to do with the awkward corner where two couches meet → idea list on home
- **try** Make this page look a little like something designed by 10 year old children who happen to be also very good at design… → Comic Neue, stickers, rotations, bright palette
- **try** Be inspired by 90's website design… blink tags… → CSS blink + marquee + under-construction vibe
- **try** Change the headline to something that matches the childish nature… → “WELCOME TO OUR SUPER COOL ZONE!!!”
- **try** Use this spiral shape i drew, but design it really neat… → `assets/spiral.svg` badge + hero

### Skipped
- none

### Conflicts
- none (Do: keyword on yellow sticky correctly upgraded to must; no opposing requests)

### Board feedback (purple / Board:)
- none

### Hub stray stickies
- none (hub had only a Lucid link-unfurl to the flow board)

## Cycle 0 (2026-10-02)
- Initial page: title "Harvest Playground", one line of invitation, empty space, footer "Cycle 0", noindex.
- Boards: flow "Harvest Playground — Cycle 0" (de6b75aa-0b51-49a1-a9e9-561e4b77d675),
  hub "Harvest Playground — Cycle 0 · Hub" (4ea33e03-7a76-45a5-8d7e-442dd1f54831).
- Applied: none (first cycle). Skipped: none. Conflicts: none.
