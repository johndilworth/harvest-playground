"""One-time seed of dashboard/public/harvest.json from journey/cycles/*/lucid-doc.json + CHANGELOG.
The nightly routine then edits harvest.json directly (see HARVEST.md § Dashboard data)."""
import json, glob
L = lambda i: f"https://lucid.app/lucidspark/{i}/edit"
A = "https://journey-assets-ai-xform.netlify.app"
FLOWDESC = {"home": "Home page (/) — leave stickies in the review frame.",
            "dinosaur": "Dino Town (/dinosaur.html) — Dinosaur, Colorado and the roadside dino hall of fame.",
            "random": "Totally Random (/random.html) — random facts page.",
            "review": "All three pages on one board: Home, Dino Town, Totally Random (split only past 5 screens)."}
changes = {
 0: dict(applied=[], skipped=[], conflicts=[], note="Initial nearly-empty page: title, invitation line, footer 'Cycle 0'."),
 1: dict(applied=[{"priority":p,"flow":"home","text":t} for p,t in [
   ("must","Paragraph with facts about longevity of turtles"),("must","Hand-sketched examples of awkward couch-corner ideas"),
   ("must","Headline font → Monoton"),("must","Picture of a turtle wearing a cap"),("must","Second, totally random page (socks)"),
   ("must","Not a boring corporate look → scrapbook / sticker layout"),("try","New page: Dinosaur, Colorado sculpture history"),
   ("try","Ideas for the awkward corner where two couches meet"),("try","Look designed by 10-year-olds who are good at design"),
   ("try","90s web design: blink + marquee"),("try","Headline → “WELCOME TO OUR SUPER COOL ZONE!!!”"),
   ("try","Neat version of the hand-drawn spiral")]], skipped=[], conflicts=[]),
 2: dict(applied=[{"priority":p,"flow":f,"text":t} for p,f,t in [
   ("must","random","New random fact (wombats poop cubes) + even more random layout"),
   ("try","home","Site-wide dark midnight-blue mode, no pinks"),("try","home","Free-form layout with bigger rotations"),
   ("try","home","Real turtle photo (Aldabra giant tortoise)"),("try","home","Photos instead of SVG drawings"),
   ("try","dinosaur","Midnight mode + playful random layout on Dino Town"),
   ("try","dinosaur","Roadside Dino Hall of Fame: 6 dinosaurs with stories and maker bios"),
   ("try","random","Midnight colour scheme on Random page")]], skipped=[],
   conflicts=["Midnight mode replaced Cycle 0 pink/bright palette (newest wins)","Photos replaced hand-sketched couch examples","Real tortoise photo replaced turtle in a cap"],
   hubStrays=["“background of pages should be slightly darker gray than frames” (later adopted as a board rule)","“only split into multiple files if a section has more than 5 flows or screens” (later adopted)","empty purple rectangle"]),
 3: dict(applied=[{"priority":"must","flow":"home","text":"Change background to purple → midnight-purple Home"},
   {"priority":"try","flow":"home","text":"Golden spiral from classical artwork → golden spiral over the Mona Lisa"}], skipped=[],
   conflicts=["Purple background (Cycle 2 board) beat Cycle 1 midnight blue on Home (newest wins)"]),
}
status = {0:"superseded",1:"superseded",2:"superseded",3:"current"}
summ = {0:"Cycle 0 — the blank canvas",1:"Cycle 1 — childish 90s playground",2:"Cycle 2 — midnight mode & roadside dinos",3:"Cycle 3 — purple Home & golden spiral"}
cycles=[]
for c in range(4):
    d=json.load(open(f"journey/cycles/{c}/lucid-doc.json"))
    docs=[{"title":"Hub","role":"hub","docId":d["hub"]["docId"],"url":L(d["hub"]["docId"]),"description":"Index board linking every flow board for this cycle (never harvested)."}]
    for b in d["boards"]:
        docs.append({"title":b["title"].split("· ")[-1] if "·" in b["title"] else "Home","role":"flow","flow":b["flow"],
                     "docId":b["docId"],"url":L(b["docId"]),"description":FLOWDESC.get(b["flow"],""),
                     "harvest":b.get("harvest",True)})
    nights=[{"date":n["date"],"stickies":n.get("stickies",0),"outcome":n.get("outcome","no_stickies" if not n.get("stickies") else "applied")}
            for n in d.get("nightlyHarvests",[])]
    if c==0: nights=[{"date":"2026-10-02","stickies":12,"outcome":"applied"}]
    if c==2: nights=[{"date":"2026-10-06","stickies":2,"outcome":"applied"}]
    pr=d.get("pullRequest")
    cycles.append({"number":c,"title":summ[c],"createdAt":d["createdAt"],"status":status[c],
        "harvestedFrom":d.get("harvestedFrom"),"pullRequest":pr,"commit":d["commit"][:7],
        "screenshot":f"{A}/harvest-playground-c{c}-home/01-home.png","documents":docs,"nightlyHarvests":nights,
        "changes":changes[c]})
out={"schemaVersion":1,
 "project":{"name":"Harvest Playground","slug":"harvest-playground",
   "description":"A playful page John's team grows one Harvest cycle at a time: leave a sticky on the current cycle's Lucid board, and every safe request is applied at 5 pm MT, merged to main and deployed.",
   "repo":"https://github.com/johndilworth/harvest-playground","site":"https://harvest-playground.netlify.app",
   "historyBoard":L("e983d07c-47f1-4d0f-bfe6-81087a3b8ddd"),"schedule":"daily 17:00 America/Denver",
   "rules":"https://github.com/johndilworth/harvest-playground/blob/main/HARVEST.md"},
 "stats":{"pullRequests":2,"pullRequestsSource":"GitHub API, state=all, 2026-10-12","nightlyHarvests":9},
 "updatedAt":"2026-10-12T09:30:00-06:00","cycles":cycles}
json.dump(out,open("dashboard/public/harvest.json","w"),indent=2,ensure_ascii=False)
