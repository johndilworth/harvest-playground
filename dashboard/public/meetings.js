// Meeting series pages (type "meeting"). All current data is FAKE test data.
const MSLUG = (location.pathname.match(/^\/m\/([a-z0-9-]+)/) || [])[1] || "harvest-weekly-sync";
const MB = `/m/${MSLUG}/`;
const fakeBanner = (d) => d.fake ? `<p class="fake-banner">⚠ FAKE TEST DATA — ${esc(d.fakeNote || "not a real meeting")}</p>` : "";
async function loadMeeting(slug = MSLUG) { const r = await fetch(`/data/meeting-${slug}.json`, { cache: "no-store" }); if (!r.ok) throw new Error("Unknown meeting " + slug); return r.json(); }
const mfmt = (d) => fmt(d + "T12:00:00");
const who = (o) => o ? esc(o) : `<span class="flag">needs owner</span>`;
const flags = (a) => (a.flags || []).filter((f) => !(f === "needs owner" && !a.owner)).map((f) => `<span class="flag">${esc(f)}</span>`).join("");
const stat = (s) => `<span class="status ${esc(String(s).replace(/ /g, "-"))}">${esc(s)}</span>`;
function msubnav(current) {
  const items = [["Meeting series", MB, "series"], ["Summaries", `${MB}summary.html`, "summary"]];
  return `<nav class="subnav" aria-label="Meeting">${items.map(([l, h, k]) => k === current ? `<a class="current" href="${h}" aria-current="page">${l}</a>` : `<a href="${h}">${l}</a>`).join("")}</nav>`;
}
function openTasks(d) {
  // Latest state per action across meetings (later meetings override earlier), excluding Done / Not Doing.
  const m = {}; [...d.meetings].sort((a, b) => a.date.localeCompare(b.date)).forEach((x) => (x.summary?.actions || []).forEach((a) => (m[a.id] = { ...a, meeting: x.id })));
  (d.cards || []).forEach((c) => { if (m[c.actionId]) m[c.actionId].status = c.status; });
  return Object.values(m).filter((a) => !["Done", "Not Doing"].includes(a.status));
}
function taskTable(ts) {
  if (!ts.length) return `<p class="muted">No open tasks.</p>`;
  return `<table><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th><th>From meeting</th></tr>${ts.map((a) => `<tr><td>${esc(a.task)}${flags(a)}</td><td>${who(a.owner)}</td><td style="white-space:nowrap">${a.due ? esc(mfmt(a.due)) : "<span class='muted'>—</span>"}</td><td>${stat(a.status)}</td><td><a href="${MB}summary.html?m=${a.meeting}">${esc(mfmt(a.meeting))}</a></td></tr>`).join("")}</table>`;
}
async function meetingSeries() {
  const d = await loadMeeting(), s = d.series, cur = d.meetings.find((m) => m.id === d.currentMeetingId);
  document.body.insertAdjacentHTML("afterbegin", nav()); document.title = `${s.name} · Harvest`;
  const prev = d.meetings.filter((m) => m !== cur).sort((a, b) => b.date.localeCompare(a.date));
  $("main").innerHTML = `${fakeBanner(d)}<div class="title-row"><h1>${esc(s.name)} <span class="tag fake">FAKE</span></h1>${msubnav("series")}</div>
  <p class="muted">${esc(s.description)} · ${esc(s.cadence)} · attendees: ${s.attendees.map((a) => esc(a.handle)).join(", ")}</p>
  <h2>Current meeting</h2>${cur ? `<div class="card current"><div class="meeting-current"><div>
    <h3 style="margin:0 0 4px">${esc(cur.title)}<span class="tag current">Current</span></h3>
    <div class="muted">${esc(mfmt(cur.date))}${cur.harvestedFrom ? ` · carried forward from <a href="${MB}summary.html?m=${cur.harvestedFrom}">${esc(mfmt(cur.harvestedFrom))}</a>` : ""}</div>
    <p>${cur.carriedIn ? `${cur.carriedIn.actions.length} action cards + ${cur.carriedIn.openItems.length} open item(s) in “From last time”.` : ""}</p>
    <p class="note-signin">Sign in to Lucid with your company account to comment — your name appears on your stickies.</p>
    <div class="doc-actions"><a class="btn-comment" href="${esc(cur.board.commentUrl)}" target="_blank" rel="noopener">Open board to comment</a><a class="small" href="${esc(cur.board.url)}" target="_blank" rel="noopener">Edit link</a></div></div>
    ${cur.board.screenshot ? `<img src="${esc(cur.board.screenshot)}" alt="Current meeting board preview">` : ""}</div></div>` : "<p class='muted'>No current meeting.</p>"}
  <h2>Open tasks across meetings</h2>${taskTable(openTasks(d))}
  <h2>Previous meetings</h2><div class="grid">${prev.map((m) => `<a class="card cycle-card" href="${MB}summary.html?m=${m.id}" style="color:inherit;text-decoration:none">
    <h3>${esc(mfmt(m.date))}<span class="tag">${esc(m.status)}</span></h3><div class="muted">${esc(m.title)}</div>
    ${m.summary ? `<div class="kv"><span><b>${m.summary.decisions.length}</b> decisions</span><span><b>${m.summary.actions.length}</b> actions</span><span><b>${m.summary.openItems.length}</b> open</span><span><b>${m.summary.flags.length}</b> flags</span></div>` : ""}
    ${m.board.screenshot ? `<img src="${esc(m.board.screenshot)}" alt="Board preview" loading="lazy">` : ""}</a>`).join("") || "<p class='muted'>None yet.</p>"}</div>
  <p class="muted">Data: <a href="/data/meeting-${MSLUG}.json">meeting-${MSLUG}.json</a> · updated ${fmt(d.updatedAt)}</p>`;
}
async function meetingSummary() {
  const d = await loadMeeting(); document.body.insertAdjacentHTML("afterbegin", nav());
  const id = new URLSearchParams(location.search).get("m");
  const done = d.meetings.filter((m) => m.summary).sort((a, b) => b.date.localeCompare(a.date));
  const m = done.find((x) => x.id === id) || done[0];
  if (!m) { $("main").innerHTML = `${fakeBanner(d)}<p class="muted">No harvested meetings yet.</p>`; return; }
  const S = m.summary, li = (a, f) => a.length ? `<ul>${a.map(f).join("")}</ul>` : "<p class='muted'>none</p>";
  document.title = `Summary ${m.date} · ${d.series.name}`;
  $("main").innerHTML = `${fakeBanner(d)}<div class="title-row"><h1><a href="${MB}">${esc(d.series.name)}</a> · ${esc(mfmt(m.date))} <span class="tag fake">FAKE</span></h1>${msubnav("summary")}</div>
  <p class="muted">${esc(m.title)} · harvested ${fmtMT(m.harvestedAt)} · ${m.stickiesRead} stickies read · <a href="${esc(m.board.commentUrl)}" target="_blank" rel="noopener">board</a>${done.length > 1 ? ` · other summaries: ${done.filter((x) => x !== m).map((x) => `<a href="?m=${x.id}">${esc(mfmt(x.date))}</a>`).join(", ")}` : ""}</p>
  <div class="chips"><span class="chip"><b>${S.decisions.length}</b> decisions</span><span class="chip"><b>${S.actions.length}</b> actions</span><span class="chip"><b>${S.openItems.length}</b> open items</span><span class="chip"><b>${S.closed.length}</b> closed</span><span class="chip"><b>${S.carriedForward.length}</b> carried forward</span></div>
  <h2>Decisions</h2><div class="card">${li(S.decisions, (x) => `<li>${esc(x.text)} <span class="muted small">— “${esc(x.quote)}” (${esc(x.source)})</span></li>`)}</div>
  <h2>Actions</h2><table><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th><th>From</th></tr>${S.actions.map((a) => `<tr><td>${esc(a.task)}${flags(a)}<div class="muted small">“${esc(a.quote)}”</div></td><td>${who(a.owner)}</td><td style="white-space:nowrap">${a.due ? esc(mfmt(a.due)) + (a.dueInferredFrom ? `<div class="muted small">from “${esc(a.dueInferredFrom)}”</div>` : "") : "<span class='muted'>—</span>"}</td><td>${stat(a.status)}</td><td>${esc(a.source)}</td></tr>`).join("")}</table>
  <h2>Open items</h2><div class="card">${li(S.openItems, (x) => `<li>${esc(x.text)}${(x.flags || []).map((f) => `<span class="flag">${esc(f)}</span>`).join("")}</li>`)}</div>
  <div class="grid" style="grid-template-columns:1fr 1fr"><div><h2>Wins</h2><div class="card">${li(S.wins, (x) => `<li>${esc(x)}</li>`)}</div></div><div><h2>Concerns</h2><div class="card">${li(S.concerns, (x) => `<li>${esc(x)}</li>`)}</div></div></div>
  <h2>Notes</h2><div class="card">${li(S.notes, (x) => `<li>${esc(x.text)} <span class="muted small">(${esc(x.source)})</span></li>`)}</div>
  <h2>Focus by attendee</h2><table class="authors"><tr><th>Attendee</th><th>Areas of focus</th></tr>${S.focus.map((f) => `<tr><td>${esc(f.attendee)}</td><td>${esc(f.items.join(", "))}</td></tr>`).join("")}</table>
  <h2>Flags</h2><div class="card">${li(S.flags, (x) => `<li>${esc(x)}</li>`)}</div>`;
}
async function homeMeetings() {
  const idx = await (await fetch("/data/meetings.json", { cache: "no-store" })).json().catch(() => null); if (!idx) return;
  const ds = await Promise.all(idx.meetings.map((m) => loadMeeting(m.slug).catch(() => null)));
  const projectsGrid = document.querySelector("main .grid.projects");
  if (projectsGrid) projectsGrid.insertAdjacentHTML("beforebegin", `<h2>Projects</h2>`);
  const foot = document.querySelector("main > p.muted:last-child");
  const html = `<h2>Meetings</h2><div class="grid projects">${idx.meetings.map((x, i) => { const d = ds[i]; if (!d) return `<div class="card">${esc(x.name)} — data unavailable</div>`;
    const cur = d.meetings.find((m) => m.id === d.currentMeetingId); const open = openTasksFor(d);
    return `<a class="card project-card" href="/m/${x.slug}/" style="color:inherit;text-decoration:none"><h3>${esc(d.series.name)} <span class="tag">Meeting</span>${d.fake ? '<span class="tag fake">FAKE</span>' : ""}</h3>
     <div class="kv"><span><b>${d.meetings.length}</b> meetings</span><span>current <b>${cur ? esc(mfmt(cur.date)) : "—"}</b></span><span><b>${open}</b> open tasks</span></div>
     ${cur?.board.screenshot ? `<img src="${esc(cur.board.screenshot)}" alt="Current meeting board" loading="lazy">` : ""}</a>`; }).join("")}</div>`;
  if (foot) foot.insertAdjacentHTML("beforebegin", html); else $("main").insertAdjacentHTML("beforeend", html);
}
function openTasksFor(d) { return openTasks(d).length; }
