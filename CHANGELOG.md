# Changelog

One entry per Harvest cycle. Each entry lists applied items, skipped items (with reason), conflicts, and board feedback.

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
