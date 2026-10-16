// Meeting series pages (type "meeting"), modelled on project dashboard / cycle pages.
const MSLUG = (location.pathname.match(/^\/m\/([a-z0-9-]+)/) || [])[1] || "team-meeting";
const MB = `/m/${MSLUG}/`;
async function loadMeeting(slug = MSLUG) { const r = await fetch(`/data/meeting-${slug}.json`, { cache: "no-store" }); if (!r.ok) throw new Error("Unknown meeting " + slug); return r.json(); }
const mfmt = (d) => fmt(d + "T12:00:00");
const mUrl = (m) => `${MB}meeting.html?m=${m.id}`;
const byDate = (ms) => [...ms].sort((a, b) => a.date.localeCompare(b.date));
// Current (unharvested) first, then newest first — same ordering rule as cycles.
const mOrdered = (ms) => [...ms].sort((a, b) => (b.status === "current") - (a.status === "current") || b.date.localeCompare(a.date));
// Narrative, else first summary line (decision / action / open / note), else title.
function meetingDesc(m) {
  const S = m.summary;
  if (S?.narrative) return S.narrative;
  const line = S?.decisions?.[0]?.text || S?.actions?.[0]?.task || S?.openItems?.[0]?.text || S?.notes?.[0]?.text;
  return (line || m.title || "").trim();
}
function mTitleRow(titleHtml) { return `<div class="title-row"><h1>${titleHtml}</h1><nav class="subnav" aria-label="Meeting"><a href="${MB}">Meeting series</a></nav></div>`; }

// ---- Activity histogram (same look as project histogram): board objects + action items ----
const MTYPES = [["obj", "Board objects (stickies/notes)", "#edad00"], ["act", "Action items", "#0071e5"]];
function meetingHistogram(ms) {
  const H = 90, BASE = 3, rows = byDate(ms).map((m) => { const a = m.activity || {}; const k = { obj: a.boardObjects || 0, act: a.actionItems || 0 }; return { m, k, t: k.obj + k.act }; });
  const max = Math.max(1, ...rows.map((r) => r.t));
  const h = (n) => (n <= 0 ? 0 : Math.max(4, Math.round((Math.sqrt(n) / Math.sqrt(max)) * (H - 8))));
  const bw = 34, gap = 22, W = Math.max(rows.length * (bw + gap) + gap, 200);
  const bars = rows.map((r, i) => {
    const x = gap + i * (bw + gap), total = h(r.t); let y = H, segs = "";
    MTYPES.forEach(([t, , col]) => { if (!r.k[t]) return; const sh = Math.max(1, Math.round(total * r.k[t] / r.t)); y -= sh; segs += `<rect x="${x}" y="${y}" width="${bw}" height="${sh}" fill="${col}"/>`; });
    const lab = r.m.date.slice(5).replace("-", "/");
    const tip = `<b>${esc(mfmt(r.m.date))}</b>${r.m.status === "current" ? " (current)" : ""}<br><b>${r.t}</b> activity${MTYPES.map(([t, l, col]) => `<br><i style="background:${col}"></i>${l}: ${r.k[t]}`).join("")}`;
    return `<g class="bar" tabindex="0" role="link" data-href="${mUrl(r.m)}" style="cursor:pointer" aria-label="Open meeting ${esc(mfmt(r.m.date))}: ${r.k.obj} board objects, ${r.k.act} action items" data-tip="${esc(tip)}">
      <rect class="hit" x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H + 22}" fill="transparent"/>
      <rect x="${x}" y="${H - BASE}" width="${bw}" height="${BASE}" style="fill:var(--chart-base)"/>${segs}
      <text x="${x + bw / 2}" y="${H + 16}" text-anchor="middle">${lab}</text></g>`;
  }).join("");
  return `<div class="card histo"><div class="histo-head"><b>Activity per meeting</b><span class="legend">${MTYPES.map(([, l, col]) => `<span><i style="background:${col}"></i>${l}</span>`).join("")}</span></div>
   <div class="histo-wrap"><svg viewBox="0 0 ${W} ${H + 22}" width="${W}" height="${H + 22}" role="group" aria-label="Activity per meeting, stacked (compressed square-root scale)">
   <line x1="0" y1="${H}" x2="${W}" y2="${H}" style="stroke:var(--chart-axis)"/>${bars}</svg><div id="tip" class="tip" role="tooltip" hidden></div></div></div>`;
}
function openTasks(d) {
  const m = {}; byDate(d.meetings).forEach((x) => (x.summary?.actions || []).forEach((a) => (m[a.id] = { ...a })));
  (d.cards || []).forEach((c) => { if (m[c.actionId]) m[c.actionId].status = c.status; });
  return Object.values(m).filter((a) => !["Done", "Not Doing"].includes(a.status));
}

// ---- Series page ----
async function meetingSeries() {
  const d = await loadMeeting(), s = d.series, ms = d.meetings;
  document.body.insertAdjacentHTML("afterbegin", nav()); document.title = `${s.name} · Harvest`;
  const tot = (k) => ms.reduce((n, m) => n + ((m.activity || {})[k] || 0), 0);
  $("main").innerHTML = `${mTitleRow(`${esc(s.name)}`)}<p class="muted">${esc(s.description)} · attendees: ${s.attendees.map((a) => esc(a.handle)).join(", ")}</p>
  ${meetingHistogram(ms)}
  <div class="chips"><span class="chip"><b>${ms.length}</b> meetings</span><span class="chip"><b>${tot("boardObjects")}</b> board objects</span><span class="chip"><b>${tot("actionItems")}</b> action items</span><span class="chip"><b>${openTasks(d).length}</b> open tasks</span><span class="chip"><b>${ms.filter((m) => m.summary).length}</b> harvests</span></div>
  <h2>Meetings</h2><div class="stack" id="meeting-stack" role="list" aria-label="Meetings, newest first on top">${mOrdered(ms).map((m) => `<a role="listitem" class="card cycle-card stack-card ${m.status}" href="${mUrl(m)}" data-meeting="${esc(m.id)}">
   ${m.board?.screenshot ? `<img class="stack-shot" src="${esc(m.board.screenshot)}" alt="" loading="lazy">` : `<div class="stack-shot" aria-hidden="true"></div>`}
   <div class="stack-body"><h3>${esc(s.name)}${statusTag(m.status)}</h3>
   <div class="stack-date muted">${esc(mfmt(m.date))}</div>
   <p class="stack-desc">${esc(meetingDesc(m))}</p></div></a>`).join("")}</div>
  <p class="muted">Data: <a href="/data/meeting-${MSLUG}.json">meeting-${MSLUG}.json</a> · updated ${fmt(d.updatedAt)}</p>`;
  setupHistogram();
  setupStack("meeting-stack");
}

// ---- Individual meeting page (like a cycle page) ----
function summaryBox(S, from) {
  const own = (a) => a.owner ? esc(a.owner) : "<b>needs owner</b>";
  // Label from status (Not Doing/Blocked/In Progress/Done); do not treat closed===true as Done.
  const actionLabel = (a) => {
    const st = a.status || (a.closed ? "Done" : "");
    if (["Done", "Not Doing", "Blocked", "In Progress"].includes(st)) return st;
    return "Action";
  };
  const items = [
    ...S.decisions.map((x) => `Decision: ${esc(x.text)}`),
    ...S.actions.map((a) => {
      const label = actionLabel(a);
      const st = a.status || (a.closed ? "Done" : "");
      const paren = st && label === "Action" ? ` (${esc(st)})` : "";
      return `${label}: ${esc(a.task)} — ${own(a)}${a.due ? `, due ${esc(mfmt(a.due))}` : ""}${paren}`;
    }),
    ...S.openItems.map((x) => `Open: ${esc(x.text)}${(x.flags || []).length ? ` — <b>${esc(x.flags.join(", "))}</b>` : ""}`),
    ...S.flags.filter((f) => !/needs owner/.test(f)).map((f) => `Flag: ${esc(f)}`),
  ];
  return `<div class="card"><p class="muted" style="margin-top:0">Harvested from the <a href="${mUrl(from)}">${esc(mfmt(from.date))}</a> board${from.harvestedAt ? ` · ${esc(fmtMT(from.harvestedAt))}` : ""}</p>${S.narrative ? `<p>${esc(S.narrative)}</p>` : ""}<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}
function meetingNav(ms, m) {
  const l = byDate(ms), i = l.indexOf(m), prev = l[i - 1], next = l[i + 1];
  if (!prev && !next) return "";
  return `<nav class="cyclenav">${prev ? `<a href="${mUrl(prev)}">← ${esc(mfmt(prev.date))}</a>` : "<span></span>"}${next ? `<a href="${mUrl(next)}">${esc(mfmt(next.date))} →</a>` : "<span></span>"}</nav>`;
}
async function meetingPage() {
  const d = await loadMeeting(), id = new URLSearchParams(location.search).get("m");
  const m = d.meetings.find((x) => x.id === id) || mOrdered(d.meetings)[0], cur = d.meetings.find((x) => x.status === "current");
  document.body.insertAdjacentHTML("afterbegin", nav()); document.title = `${m.date} · ${d.series.name}`;
  const from = m.harvestedFrom ? d.meetings.find((x) => x.id === m.harvestedFrom) : null;
  const title = `<a href="${MB}">${esc(d.series.name)}</a> · ${esc(mfmt(m.date))}${statusTag(m.status)}${m.status !== "current" && cur && cur !== m ? ` <a class="small" style="font-size:14px;font-weight:normal" href="${mUrl(cur)}">Go to current meeting (${esc(mfmt(cur.date))}) →</a>` : ""}`;
  const next = d.meetings.find((x) => x.harvestedFrom === m.id);
  $("main").innerHTML = `${mTitleRow(title)}
  <p class="muted">${esc(m.title)} · created ${fmt(m.createdAt)}${from ? ` · carried forward from ${esc(mfmt(from.date))}` : ""} · ${(m.activity || {}).boardObjects || 0} board objects · ${(m.activity || {}).actionItems || 0} action items</p>
  <h2>Lucid document</h2>${docsHtml([{ title: m.title, flow: m.board.flow || "meeting", description: "Meeting board", url: m.board.url, commentUrl: m.board.commentUrl }], m.status, m.board.screenshot)}
  <h2>Summary from last meeting</h2>${from && from.summary ? summaryBox(from.summary, from) : `<div class="card"><p class="muted" style="margin:0">First meeting in the series — no previous summary.${next ? ` This board's harvest is on the <a href="${mUrl(next)}">${esc(mfmt(next.date))}</a> page.` : ""}</p></div>`}
  ${m.status === "current" && d.series.trigger ? `<h2>Harvest</h2><div class="card"><p class="muted">Harvests this meeting's board now: writes the summary and creates the next meeting board with open actions carried forward.</p><div id="trig"><button disabled>Checking…</button></div></div>` : ""}
  ${meetingNav(d.meetings, m)}`;
  if (m.status === "current" && d.series.trigger) setupMeetingTrigger(m);
}
// Same modal pattern as setupTrigger() in app.js; posts {action:"harvest", meeting:<slug>}.
async function setupMeetingTrigger(m) {
  let s;
  try { s = await (await fetch("/api/trigger", { cache: "no-store" })).json(); }
  catch { $("#trig").innerHTML = `<button disabled>Harvest meeting</button> <span class="muted">Trigger endpoint unavailable.</span>`; return; }
  if (!s.configured) { $("#trig").innerHTML = `<button disabled>Harvest meeting</button> <span class="muted">Not configured — manual trigger is disabled (env vars not set).</span>`; return; }
  $("#trig").innerHTML = `<button id="open-run">Harvest meeting</button>`;
  document.body.insertAdjacentHTML("beforeend", `<div id="run-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="run-title"><div class="modal-box">
   <h2 id="run-title">Harvest meeting — ${esc(mfmt(m.date))}</h2><p class="muted">Harvests the ${esc(mfmt(m.date))} board now, writes its summary and creates the next meeting board.</p>
   <label>Passphrase<br><input id="sec" type="password" autocomplete="off"></label>
   <p id="trigmsg" class="msg" aria-live="polite"></p><div class="actions"><button id="cancel" class="secondary">Cancel</button><button id="go" disabled>Harvest</button></div></div></div>`);
  const md = $("#run-modal"), msg = $("#trigmsg"), close = () => { md.hidden = true; };
  const valid = () => { $("#go").disabled = !$("#sec").value; };
  $("#open-run").onclick = () => { md.hidden = false; msg.textContent = ""; msg.className = "msg"; $("#sec").focus(); };
  $("#cancel").onclick = close; md.onclick = (e) => { if (e.target === md) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  $("#sec").oninput = valid;
  $("#go").onclick = async () => {
    $("#go").disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
    try {
      const r = await fetch("/api/trigger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "harvest", meeting: MSLUG, secret: $("#sec").value, confirm: "RUN" }) });
      const j = await r.json().catch(() => ({}));
      msg.className = "msg " + (r.ok ? "ok" : "err");
      msg.textContent = r.ok ? (j.message || "Meeting harvest started.") : `Failed: ${j.error || "HTTP " + r.status}`;
    } catch { msg.className = "msg err"; msg.textContent = "Failed: network error"; }
    valid();
  };
}

// ---- Home: Meetings section next to Projects ----
async function homeMeetings() {
  const idx = await (await fetch("/data/meetings.json", { cache: "no-store" })).json().catch(() => null); if (!idx) return;
  const ds = await Promise.all(idx.meetings.map((m) => loadMeeting(m.slug).catch(() => null)));
  const projectsGrid = document.querySelector("main .grid.projects");
  if (projectsGrid) projectsGrid.insertAdjacentHTML("beforebegin", `<h2>Projects</h2>`);
  const foot = document.querySelector("main > p.muted:last-child");
  const html = `<h2>Meetings</h2><div class="grid projects">${idx.meetings.map((x, i) => { const d = ds[i]; if (!d) return `<div class="card">${esc(x.name)} — data unavailable</div>`;
    const cur = d.meetings.find((m) => m.status === "current");
    return `<a class="card project-card" href="/m/${x.slug}/" style="color:inherit;text-decoration:none"><h3>${esc(d.series.name)} <span class="tag">Meeting</span></h3>
     <div class="kv"><span><b>${d.meetings.length}</b> meetings</span><span>current <b>${cur ? esc(mfmt(cur.date)) : "—"}</b></span><span><b>${openTasks(d).length}</b> open tasks</span></div>
     ${cur?.board.screenshot ? `<img src="${esc(cur.board.screenshot)}" alt="Current meeting board" loading="lazy">` : ""}</a>`; }).join("")}</div>`;
  if (foot) foot.insertAdjacentHTML("beforebegin", html); else $("main").insertAdjacentHTML("beforeend", html);
}
