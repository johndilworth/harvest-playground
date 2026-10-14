# Meeting board helpers (proven on the FAKE Harvest Weekly Sync boards, Oct 2026)
- `build_board.py` — `js(title, attendeeRows, content, cards)` returns a lucid_run_script source that replicates
  template 784fd831-… exactly (7 frames, orange header, Fraunces headings, Good/Bad sub-frames, Areas of focus table
  with one row per attendee) and optionally drops left-aligned stickies and cards. Needs the `dynamicmatrix` skill loaded.
  If `cards` is non-empty it also needs `lucidcards` → run structure and cards as two scripts (see carry-cards.example.js).
- `carry-cards.example.js` — creates cards (Title, Assignee, EndTime, Status, Description, custom "Source Meeting") +
  open-item stickies in "From last time". Needs `lucidcards` loaded.
- `narrative-block.example.js` — narrative text block (Fraunces 44 heading + Inter 28 body, left/top) under the cards.
- `read-board.js` — (NOT yet run; MCP `fetch` is the proven read path) all frames + stickies/cards/text with bbox and parent frame.
- `cards.example.js` — read card fields incl. Source Meeting.
New blank doc: `lucid_create_diagram_from_specification` (product lucidchart, use_assisted_layout false) with one
placeholder rectangle id "tmp", then delete it (`b.deleteItem({itemIds:["tmp"]})`).
Comment link: `lucid_create_document_share_link(document_id, role:"comment", restrict_to_account:true, allow_anonymous:false)`.
Gotchas: `editBlockStyle` throws if nothing changes (don't restyle sub-frames/table columns); `inspect` takes an array;
text styles are `[{style,value}]`; scripts are atomic (any error reverts everything).
