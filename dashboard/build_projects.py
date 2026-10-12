"""One-time seed of the multi-project data files (dashboard/public/data/). Sources: harvest.json (Harvest Playground),
design-loop-sample-prototype git history (journey/cycles/*, summary.json, PR list), harvest-for-lucid-site git history
(journey/cycles/*, STATUS), Lucid search (doc ids confirmed 2026-10-12). Unknown values are null / noted, never invented.
After seeding, each project's data file is edited directly by its harvest routine (HARVEST.md § Dashboard)."""
import json, subprocess, os
D = os.path.dirname(os.path.abspath(__file__)); PUB = f"{D}/public"
CAP = "https://harvest-dashboard.netlify.app/captures"
LC = lambda i: f"https://lucid.app/lucidchart/{i}/edit"
def git(repo, *a): return subprocess.check_output(["git", "-C", repo, *a], text=True)
def zero(): return {"red": 0, "yellow": 0, "blue": 0, "purple": 0}
def dump(slug, obj): json.dump(obj, open(f"{PUB}/data/{slug}.json", "w"), indent=2, ensure_ascii=False)

# ---------- Harvest Playground (existing data, screenshots moved to /captures) ----------
hp = json.load(open(f"{D}/seed/harvest.json"))
hp["schemaVersion"] = 3
hp["project"].update({"harvestMode": "nightly", "trigger": True,
    "rules": "https://github.com/johndilworth/harvest-playground/blob/main/HARVEST.md"})
for c in hp["cycles"]:
    c["screenshot"] = c["screenshot"].replace("https://journey-assets-ai-xform.netlify.app/harvest-playground-", f"{CAP}/harvest-playground/")
dump("harvest-playground", hp)

# ---------- Design Loop ----------
DL = "/workspace/design-loop/design-loop-sample-prototype"; REF = "origin/cycle-4-feedback"
summ = {c["cycle"]: c for c in json.loads(git(DL, "show", f"{REF}:journey/cycles/summary.json"))["cycles"]}
fb = {}
for n in (1, 2, 3, 4, 5):
    d = json.loads(git(DL, "show", f"{REF}:journey/cycles/{n}/harvest/feedback.json"))
    fb[n] = [dict(f, flow=fr.get("flow") or fr.get("stepKey")) for fr in d.get("frames", []) for f in fr.get("feedback", [])]
PRI = {"must": "red", "try": "yellow", "maybe": "blue", "consider": "blue"}
dl_meta = {  # capture commit + date (git log of the capture commit), board(s), screenshot, PR that produced the cycle
 1: ("4345c9b", "77283a9", None, [("9a9f5f0a-dfec-4dbb-8249-679a82bd0cb5", "Design loop — Cycle 1 review", "2 pages: signup (4), vendor-approval (4)")], "c1r-signup/01-signup-01-create-account.png", "Cycle 1 — signup + vendor approval baseline"),
 2: ("d5e8484", "5461dff", 1, [("d56b0edf-53e9-4933-a64b-a2be6c500d0d", "Design loop — Cycle 2 review (PR #1)", "2 pages: signup (4), vendor-approval (4); before/after vs cycle 1")], "c2-signup/01-signup-01-create-account.png", "Cycle 2 — signup polish, square corners (PR #1)"),
 3: ("b041c64", "2649ac4", 2, [("934e442a-203d-441c-b216-e0340808aa6b", "Design loop — Cycle 3 review (PR #2)", "3 pages: landing (1), signup (5), vendors (4)")], "c3-landing/01-home-00-landing.png", "Cycle 3 — header + logo, tiles, ASCII background, invite step (PR #2)"),
 4: ("6b5b476", "20c1782", 3, [("c95ea620-f506-4499-9d67-dc821b143297", "Design loop — Cycle 4 review (PR #3, final)", "3 pages: landing (1), signup (5), vendors (4)")], "c4-landing/01-home-00-landing.png", "Cycle 4 — dark mode, JetBrains Mono, landing page (PR #3)"),
 5: ("e71866a", "22cbecb", 4, [("89d26530-417e-44f0-ae5d-afa58a59fe83", "Design loop — Cycle 5 review (PR #4) v2", "Current review board: 4 pages (landing 1, signup 4, vendors 4, add vendor 3); board rules R1–R7"),
                              ("80e68a74-a706-4fe1-b22f-4dfc5c5eb215", "Design loop — Cycle 5 review (PR #4) v1", "Superseded by v2; holds the 8 purple board-format stickies harvested 2026-10-02")], "c5-landing/01-home-00-landing.png", "Cycle 5 — testimonials, combined workspace + invite, add vendor (PR #4)"),
}
cycles = []
for n, (cap, built, pr, docs, shot, title) in dl_meta.items():
    created = git(DL, "log", "-1", "--format=%cI", cap).strip()
    prev = fb.get(n - 1, [])  # stickies harvested from the previous cycle's board produced THIS cycle's changes
    k = zero()
    for f in prev: k[PRI.get(f.get("priority"), "yellow")] += 1
    s = summ.get(n, {})
    cycles.append({"number": n, "title": title, "createdAt": created, "status": "current" if n == 5 else "superseded",
      "harvestedFrom": n - 1 if n > 1 else None,
      "pullRequest": f"https://github.com/johndilworth/design-loop-sample-prototype/pull/{pr}" if pr else None,
      "commit": built, "screenshot": f"{CAP}/design-loop/{shot}",
      "previewUrl": f"https://deploy-preview-{pr}--design-loop-sample-prototype.netlify.app" if pr else "https://design-loop-sample-prototype.netlify.app",
      "documents": [{"title": t, "role": "flow", "flow": "review", "docId": i, "url": LC(i), "description": desc, "harvest": True} for i, t, desc in docs],
      "authors": [], "authorsNote": "Not recorded — this cycle was harvested before sticky attribution was read (2026-10-12).",
      "nightlyHarvests": [], "manualHarvests": [{"date": json.loads(git(DL, "show", f"{REF}:journey/cycles/{n}/harvest/feedback.json"))["harvestedAt"][:10],
                                                 "stickies": len(fb[n]), "outcome": "applied" if fb[n] else "no_stickies"}],
      "screens": s.get("screensCaptured"),
      "changes": {"applied": [{"priority": f.get("priority") or "try", "flow": f["flow"], "text": " ".join(f["text"].split())[:220]} for f in prev],
                  "skipped": [], "conflicts": [], **({"note": s["resolvedNote"]} if prev and s.get("resolvedNote") else {}),
                  **({"note": "Initial capture of the prototype at commit 77283a9 (no earlier board)."} if n == 1 else {})},
      "contributions": k})
cycles[-1]["changes"]["boardFeedback"] = "Cycle 5 harvest: 0 app stickies; 8 purple board-format stickies → board rules R1–R7 applied to the tooling and the v2 board (not a site change)."
cycles[-1]["manualHarvests"][0]["stickies"] = 8; cycles[-1]["manualHarvests"][0]["outcome"] = "board_feedback_only"
dump("design-loop", {"schemaVersion": 3,
  "project": {"name": "Design Loop", "slug": "design-loop", "harvestMode": "manual", "trigger": False,
    "description": "Northwind AI Ops sample prototype (signup, vendor approval, add vendor). Each cycle is captured from a PR deploy preview, reviewed on a Lucidchart board, and the stickies become the next PR.",
    "repo": "https://github.com/johndilworth/design-loop-sample-prototype", "site": "https://design-loop-sample-prototype.netlify.app",
    "historyBoard": LC("01d8c4f0-95d2-4de7-b997-d9a83df20ccb"), "historyBoardLabel": "Evolution c1→c4 ↗",
    "schedule": "manual (no nightly routine)", "rules": "https://github.com/johndilworth/harvest-playground/blob/main/HARVEST.md"},
  "stats": {"pullRequests": 4, "pullRequestsSource": "GitHub API state=all 2026-10-12: PRs #1–#4 all OPEN (not merged)", "nightlyHarvests": 0, "manualHarvests": 5},
  "updatedAt": "2026-10-12T13:30:00-06:00", "cycles": cycles})

# ---------- Harvest Site ----------
HS = "/workspace/harvest-site/repo"
f1 = json.load(open(f"{HS}/journey/cycles/1/harvest/feedback.json"))
items = [dict(f, flow=s["stepKey"]) for s in f1["screens"] for f in s["feedback"]]
k2 = zero(); applied = []; skipped = []
for f in items:
    if not f["text"].strip(): skipped.append({"text": "(empty sticky on " + f["flow"] + ")", "reason": "empty"}); continue
    k2[PRI[f["priority"]]] += 1; applied.append({"priority": f["priority"], "flow": f["flow"], "text": " ".join(f["text"].split())[:220]})
hs_c = [
 {"number": 1, "title": "Cycle 1 — Harvest for Lucidchart concept site", "createdAt": git(HS, "log", "-1", "--format=%cI", "db6b2a1").strip(),
  "status": "superseded", "harvestedFrom": None, "pullRequest": None, "commit": "8cec138",
  "screenshot": f"{CAP}/harvest-site/c1-home/01-home-01-hero.png", "previewUrl": None,
  "documents": [{"title": "Harvest site — Cycle 1 review", "role": "flow", "flow": "review", "docId": "58ff5647-5bbd-472f-b880-d91bec0f4005",
                 "url": LC("58ff5647-5bbd-472f-b880-d91bec0f4005"), "description": "4 pages: home (11), beta-signup (4), how-it-works (5), pricing (2)", "harvest": True}],
  "authors": [], "authorsNote": "Not recorded — harvested before sticky attribution was read.",
  "nightlyHarvests": [], "manualHarvests": [{"date": "2026-10-02", "stickies": 6, "outcome": "applied"}], "screens": 22,
  "changes": {"applied": [], "skipped": [], "conflicts": [], "note": "Initial capture of production @8cec138 (22 screens)."}, "contributions": zero()},
 {"number": 2, "title": "Cycle 2 — single Harvest header, renamed to Harvest (PR #1)", "createdAt": git(HS, "log", "-1", "--format=%cI", "b769f81").strip(),
  "status": "current", "harvestedFrom": 1, "pullRequest": "https://github.com/johndilworth/harvest-for-lucid-site/pull/1", "commit": "7a89b64",
  "screenshot": f"{CAP}/harvest-site/c2-home/01-home-01-hero.png", "previewUrl": "https://deploy-preview-1--harvest-for-lucid.netlify.app",
  "documents": [{"title": t, "role": "flow", "flow": fl, "docId": i, "url": LC(i), "description": desc, "harvest": True} for i, t, fl, desc in [
    ("94e6f74e-a6ce-43cd-a33d-73bb349db041", "Harvest site — Cycle 2 review (PR #1) · Home", "home", "11 screens"),
    ("c7af9ce3-3fbe-431b-8745-aab57fa2f2c2", "Harvest site — Cycle 2 review (PR #1) · Beta signup", "beta-signup", "4 screens"),
    ("e036d1c4-3f8b-4069-b797-b8e338bca337", "Harvest site — Cycle 2 review (PR #1) · How it works", "how-it-works", "5 screens"),
    ("3071b809-3d20-47e9-b24c-5e494f58d5b6", "Harvest site — Cycle 2 review (PR #1) · Pricing", "pricing", "2 screens")]],
  "authors": [], "authorsNote": "No harvest of the Cycle 2 boards yet.",
  "nightlyHarvests": [], "manualHarvests": [], "screens": 22,
  "changes": {"applied": applied, "skipped": skipped, "conflicts": [], "note": "Cycle 1 board stickies implemented in PR #1 (open, not merged). Cycle 2 hub ab0c1380 not listed (no hubs, v2)."},
  "contributions": k2}]
dump("harvest-site", {"schemaVersion": 3,
  "project": {"name": "Harvest Site", "slug": "harvest-site", "harvestMode": "manual", "trigger": False,
    "description": "Concept marketing site for Lucid Harvest for Lucidchart (home, beta signup, how it works, pricing). Reviewed on Lucidchart boards; stickies become a PR.",
    "repo": "https://github.com/johndilworth/harvest-for-lucid-site", "site": "https://harvest-for-lucid.netlify.app",
    "historyBoard": None, "schedule": "manual (no nightly routine)", "rules": "https://github.com/johndilworth/harvest-playground/blob/main/HARVEST.md"},
  "stats": {"pullRequests": 1, "pullRequestsSource": "GitHub API state=all 2026-10-12: PR #1 OPEN", "nightlyHarvests": 0, "manualHarvests": 1},
  "updatedAt": "2026-10-12T13:30:00-06:00", "cycles": hs_c})
print("ok")
