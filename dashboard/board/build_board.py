#!/usr/bin/env python3
"""Lucidchart review board spec for a Harvest Dashboard cycle (one page; split only if a flow has >5 screens).
Board rules (HARVEST.md § Board rules + prototype-to-lucid-journey-map skill): #F2F3F5 sparkFrame, no border, square,
400 px padding, screenshot first, ~360 px gap, caption; title + description; legend Do/Must do (red), Try (yellow),
Consider (blue), purple = board feedback; sticky-author line; no hub. Page background #E8EAED is set after import
(skills.pages.setBackgroundColor). Usage: python3 build_board.py <cycle> <commit> > c<N>/lucid-spec.json"""
import json, sys, html
from PIL import Image
N, COMMIT = int(sys.argv[1]), sys.argv[2]
MODE = sys.argv[3] if len(sys.argv) > 3 else "review"   # "review" (all pages) or "meetings" (meeting pages board, since cycle 3)
PAD, GAP, HGAP, FW = 400, 360, 480, 1440
SITE = "https://harvest-dashboard.netlify.app"; CAP = f"{SITE}/captures/harvest-dashboard/c{N}-{MODE}"
LOCAL = f"../public/captures/harvest-dashboard/c{N}-{MODE}"
SCREENS = [("01-home", "/", "Home — all Harvest projects", "Dark mode by default; sun/moon toggle in the top-right of the header. Project cards: name + harvest mode, 'N cycles / date', tightened sparkline, screenshot."),
 ("02-project-dashboard", "/p/harvest-playground/", "Project dashboard (Harvest Playground)", "Compact contributions chart (no card, padding or labels; bars touch, newest left; hover for date + key). Cycle cards as a left-anchored stack, newest on top."),
 ("03-cycle", f"/p/harvest-dashboard/cycle.html?c={N}", f"Cycle page (Harvest Dashboard · Cycle {N})", "Title is [Project name] · Cycle N with project name linking to the project dashboard; subnav on the title row. Lucid documents with Open board to comment; Manual harvests with Run harvest now."),
 ("04-run-harvest-modal", f"/p/harvest-dashboard/cycle.html?c={N}", "Run harvest modal", "Passphrase only; posts project 'harvest-dashboard' to the harvest webhook (dark mode)."),
 ("05-summary", "/p/harvest-playground/summary.html", "Summary (all cycles of a project)", "Title is [Project name] · Summary (breadcrumb). Each cycle row now has its screenshot (same image as the cycle cards).")]
if MODE == "meetings":
    import json as _j
    _m = _j.load(open("../public/data/meeting-team-meeting.json"))["currentMeetingId"]
    SCREENS = [("01-meetings", "/m/team-meeting/", "Meetings — Team Meeting series", "Activity histogram (board objects + action items per meeting), then every meeting with the current (unharvested) one first."),
     ("02-meeting-current", f"/m/team-meeting/meeting.html?m={_m}", f"Current meeting page ({_m})", "Lucid board link, concise summary of the last meeting, Harvest meeting button, previous/next meeting links.")]
e = lambda s: html.escape(s, quote=False)
def text(i, x, y, w, h, t): return {"id": i, "type": "text", "boundingBox": {"x": x, "y": y, "w": w, "h": h}, "text": t}
shots = []
for k, route, title, cap in SCREENS:
    w, h = Image.open(f"{LOCAL}/{k}.png").size; shots.append((k, route, title, cap, round(h * FW / w)))
CHANGES = {"01-home": "Dark mode (default) + header toggle; cards show 'N cycles / date' (no 'current Cycle x' or 'last harvest' label); tighter sparklines with brighter colours.",
 "02-project-dashboard": "Contributions chart made compact: no card, padding, margins or C-labels; bars side by side with no gaps.",
 "03-cycle": "Dark mode + header toggle.", "04-run-harvest-modal": "Dark mode.", "05-summary": "Screenshot column added (same image as the cycle cards)."}
PREV = f"{SITE}/captures/harvest-dashboard/c{N-1}-review" if N > 1 and MODE == "review" else None
BOARD = "All pages" if MODE == "review" else "Meetings"
BW, BH = 720, 512
FH = PAD + max(s[4] for s in shots) + GAP + 260 + (120 + BH + 80 if PREV else 0) + PAD
W = len(shots) * (FW + 2 * PAD) + (len(shots) - 1) * HGAP
sh = [text("doc-title", 0, -900, W, 240, f"<p style='font-size:40pt;text-align:left'><b>Harvest Dashboard — Cycle {N} review · {BOARD}</b><br>"
           f"<span style='font-size:20pt'>{len(shots)} screens, left → right · Desktop 1440 wide (full page) · commit {COMMIT[:7]} · "
           f"<a href=\"{SITE}\">{SITE}</a> · harvested manually (no nightly routine)</span></p>"),
      text("legend-box", 0, -600, 2600, 440, "<p style='font-size:22pt;text-align:left'><b>How to add anything</b><br>Put a sticky note INSIDE a grey frame "
           "and write what you want changed on that page of the dashboard. Harvests of this project are manual (Run harvest now on the current "
           "cycle page); safe requests are applied, committed and deployed. Start with <b>Do:</b> / <b>Must do</b>, <b>Try:</b> or <b>Consider:</b> "
           "to set priority (the words win over the colour); otherwise the colour counts. Purple = feedback about this board.<br>"
           "<b>Stickies show your name — stay signed in.</b></p>")]
for i, (name, fill, line, label, tc) in enumerate([("Red", "#FF8A80", "#C62828", "Do / Must do", None), ("Yellow", "#FFE066", "#9A7B00", "Try", None),
                                                 ("Blue", "#A3E4FF", "#1565C0", "Consider", None), ("Purple", "#BA23F6", "#7B1FA2", "Board feedback", "#FFFFFF")]):
    st = {"fill": {"type": "color", "color": fill}, "stroke": {"color": line, "width": 2, "style": "solid"}}
    if tc: st["textColor"] = tc
    sh.append({"id": f"legend-{name.lower()}", "type": "rectangle", "boundingBox": {"x": 2700 + i * 320, "y": -570, "w": 260, "h": 300}, "style": st,
               "text": f"<p style='font-size:24pt;text-align:center'><b>{name}</b><br>{label}</p>"})
x = 0
for k, route, title, cap, ih in shots:
    sh.append({"id": f"frame-{k}", "type": "sparkFrame", "boundingBox": {"x": x, "y": 0, "w": FW + 2 * PAD, "h": FH},
               "style": {"fill": {"type": "color", "color": "#F2F3F5"}, "stroke": {"color": "#F2F3F5", "width": 0, "style": "solid"}},
               "title": f"{k} · {route} · {title}", "customData": [{"key": "stepKey", "value": k}, {"key": "route", "value": route}, {"key": "cycle", "value": str(N)}]})
    sh.append({"id": f"shot-{k}", "type": "image", "boundingBox": {"x": x + PAD, "y": PAD, "w": FW, "h": ih}, "image": {"type": "image", "url": f"{CAP}/{k}.png"},
               "stroke": {"color": "#C9CED8", "width": 2, "style": "solid"}, "actions": [{"type": "url", "url": SITE + route, "newWindow": True}]})
    sh.append(text(f"caption-{k}", x + PAD, PAD + ih + GAP, FW, 220, f"<p style='font-size:22pt;text-align:left'><b>{k} · {e(title)}</b><br>"
                   f"<span style='font-size:16pt'>{e(cap)}</span><br><span style='font-size:16pt'>Live: <a href=\"{SITE + route}\">{SITE + route}</a></span></p>"))
    if PREV:
        y0 = PAD + ih + GAP + 260
        sh.append(text(f"changes-{k}", x + PAD, y0, FW, 100, f"<p style='font-size:18pt;text-align:left'><b>Changes in this cycle:</b> {e(CHANGES.get(k, ''))}</p>"))
        sh.append(text(f"before-label-{k}", x + PAD, y0 + 110, BW, 60, f"<p style='font-size:16pt;text-align:left'>Cycle {N-1} (before) · reference only</p>"))
        sh.append({"id": f"before-{k}", "type": "image", "boundingBox": {"x": x + PAD, "y": y0 + 180, "w": BW, "h": BH}, "image": {"type": "image", "url": f"{PREV}/{k}.png"},
                   "stroke": {"color": "#C9CED8", "width": 1, "style": "solid"}})
    x += FW + 2 * PAD + HGAP
print(json.dumps({"version": 1, "pages": [{"id": MODE, "title": f"Cycle {N} · {BOARD}", "shapes": sh}]}, ensure_ascii=False))
