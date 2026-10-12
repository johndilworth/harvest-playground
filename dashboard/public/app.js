const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Denver" });
const nav = (p) => `<header class="top"><b>${esc(p.name)} · Harvest</b><nav><a href="/">Dashboard</a><a href="/summary.html">Summary</a><a href="${p.site}">Live site ↗</a><a href="${p.historyBoard}">History board ↗</a></nav></header>`;
async function load() { const r = await fetch("/harvest.json", { cache: "no-store" }); return r.json(); }
const ordered = (cs) => [...cs].sort((a, b) => (b.status === "current") - (a.status === "current") || b.number - a.number);

async function dashboard() {
  const d = await load(), p = d.project, cs = d.cycles, cur = cs.find((c) => c.status === "current");
  const applied = cs.reduce((n, c) => n + c.changes.applied.length, 0), skipped = cs.reduce((n, c) => n + c.changes.skipped.length, 0);
  document.body.insertAdjacentHTML("afterbegin", nav(p));
  $("main").innerHTML = `<h1>${esc(p.name)}</h1><p class="muted">${esc(p.description)}</p>
  <div class="grid">
   <div class="card stat"><div class="n">${cs.length}</div><div class="l">Cycles</div></div>
   <div class="card stat"><div class="n">${d.stats.pullRequests}</div><div class="l">Pull requests created</div></div>
   <div class="card stat"><div class="n">${applied}</div><div class="l">Stickies applied</div></div>
   <div class="card stat"><div class="n">${d.stats.nightlyHarvests}</div><div class="l">Nightly harvests</div></div></div>
  <h2>Cycles</h2><div class="grid">${ordered(cs).map((c) => `<a class="card cycle-card ${c.status}" href="/cycle.html?c=${c.number}" style="color:inherit;text-decoration:none">
   <h3>Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>`}</h3>
   <div class="muted">${fmt(c.createdAt)} · ${c.documents.length} Lucid docs · ${c.changes.applied.length} applied · ${authorsTotal(c)} stickies by ${authorsCount(c)} author(s)</div><div>${esc(c.title)}</div>
   <img src="${c.screenshot}" alt="Cycle ${c.number} home screenshot" loading="lazy"></a>`).join("")}</div>
  <p class="muted">Data: <a href="/harvest.json">harvest.json</a> · updated ${fmt(d.updatedAt)} · <a href="${p.rules}">Harvest rules</a> · ${skipped} skipped overall</p>`;
}

async function cycle() {
  const d = await load(), n = +new URLSearchParams(location.search).get("c"), c = d.cycles.find((x) => x.number === n) || ordered(d.cycles)[0];
  document.body.insertAdjacentHTML("afterbegin", nav(d.project)); document.title = `Cycle ${c.number} · Harvest Playground`;
  const ch = c.changes;
  $("main").innerHTML = `<p><a href="/">← Dashboard</a></p><h1>Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>`}</h1>
  ${cycleNav(d.cycles, c)}
  <p class="muted">${esc(c.title)} · created ${fmt(c.createdAt)}${c.harvestedFrom != null ? ` · harvested from Cycle ${c.harvestedFrom}` : ""}${c.pullRequest ? ` · <a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""} · commit <code>${esc(c.commit)}</code>${c.previewUrl ? ` · <a class="preview" href="${c.previewUrl}">Preview ↗</a>` : ""}</p>
  <h2>Lucid documents</h2>${c.documents.map((x) => `<div class="card doc"><div><b><a href="${x.url}">${esc(x.title)}</a></b><span class="tag">${"flow: " + esc(x.flow)}</span>
   <div class="muted">${esc(x.description)}</div></div><div class="muted" style="white-space:nowrap">${fmt(c.createdAt)} · ${c.status === "current" ? "open for stickies" : "harvested"}</div></div>`).join("")}
  <h2>Changes made in this cycle (${ch.applied.length} applied, ${ch.skipped.length} skipped)</h2><div class="card">
   ${ch.note ? `<p>${esc(ch.note)}</p>` : ""}${ch.applied.length ? `<ul>${ch.applied.map((a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.flow)} — ${esc(a.text)}</li>`).join("")}</ul>` : ""}
   ${ch.skipped.length ? `<p><b>Skipped</b></p><ul>${ch.skipped.map((s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i></li>`).join("")}</ul>` : "<p class='muted'>Skipped: none</p>"}
   ${ch.conflicts.length ? `<p><b>Conflicts</b></p><ul>${ch.conflicts.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>
  <h2>Sticky authors</h2><div class="card">${authorsHtml(c)}</div>
  <h2 id="nightly">Nightly harvests</h2><div class="card">${c.status === "current" ? `<p class="muted">Harvests this cycle's boards immediately and creates Cycle ${c.number + 1}. Normally runs at 5 pm MT.</p><div id="trig"><button disabled>Checking…</button></div>` : ""}${c.nightlyHarvests.length ? `<ul>${c.nightlyHarvests.map((h) => `<li>${esc(h.date)} — ${h.stickies} stickies (${esc(h.outcome)})</li>`).join("")}</ul>` : "<p class='muted'>None yet — next harvest at 5 pm MT.</p>"}</div>
  <h2>Screenshot</h2><img src="${c.screenshot}" alt="" style="max-width:100%;border:1px solid #d5d8dc">
  ${cycleNav(d.cycles, c)}`;
  if (c.status === "current") setupTrigger(c);
}

async function summary() {
  const d = await load(); document.body.insertAdjacentHTML("afterbegin", nav(d.project));
  const li = (a, f) => a.length ? `<ul>${a.map(f).join("")}</ul>` : "<span class='muted'>none</span>";
  $("main").innerHTML = `<h1>Summary of all cycles</h1><p class="muted">Every cycle and the changes it shipped, from CHANGELOG.md / HISTORY.md.</p>
  <table><tr><th>Cycle</th><th>Date</th><th>Status</th><th>Applied</th><th>Skipped (reason)</th><th>Conflicts</th><th>Sticky authors</th></tr>
  ${[...d.cycles].sort((a, b) => b.number - a.number).map((c) => `<tr><td><a href="/cycle.html?c=${c.number}">Cycle ${c.number}</a>${c.pullRequest ? `<br><a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""}</td>
   <td style="white-space:nowrap">${fmt(c.createdAt)}</td><td>${esc(c.status)}</td>
   <td>${c.changes.note ? esc(c.changes.note) : ""}${c.changes.applied.length || !c.changes.note ? li(c.changes.applied, (a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.text)}</li>`) : ""}</td>
   <td>${li(c.changes.skipped, (s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i></li>`)}</td>
   <td>${li(c.changes.conflicts, (s) => `<li>${esc(s)}</li>`)}</td>
   <td>${li(c.authors || [], (a) => `<li>${esc(a.name)} — ${a.stickies}</li>`)}</td></tr>`).join("")}</table>
  <h2>Sticky authors, all cycles</h2><div class="card">${authorsHtml({ authors: allAuthors(d.cycles) })}</div>`;
}

const authorsTotal = (c) => (c.authors || []).reduce((n, a) => n + a.stickies, 0);
const authorsCount = (c) => (c.authors || []).length;
function allAuthors(cs) { const m = {}; cs.forEach((c) => (c.authors || []).forEach((a) => (m[a.name] = (m[a.name] || 0) + a.stickies))); return Object.entries(m).map(([name, stickies]) => ({ name, stickies })).sort((a, b) => b.stickies - a.stickies); }
function authorsHtml(c) {
  const a = c.authors || [];
  if (!a.length) return "<p class='muted'>No stickies harvested from these boards yet.</p>";
  return `<table class="authors"><tr><th>Author</th><th>Stickies</th></tr>${a.map((x) => `<tr><td>${esc(x.name)}</td><td>${x.stickies}</td></tr>`).join("")}</table><p class="muted">“anonymous” = the sticky had no author attribution.</p>`;
}
function cycleNav(cs, c) {
  const prev = cs.find((x) => x.number === c.number - 1), next = cs.find((x) => x.number === c.number + 1);
  if (!prev && !next) return "";
  return `<nav class="cyclenav">${prev ? `<a href="/cycle.html?c=${prev.number}">← Cycle ${prev.number}</a>` : "<span></span>"}${next ? `<a href="/cycle.html?c=${next.number}">Cycle ${next.number} →</a>` : "<span></span>"}</nav>`;
}
async function setupTrigger(c) {
  let s;
  try { s = await (await fetch("/api/trigger", { cache: "no-store" })).json(); }
  catch { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Trigger endpoint unavailable.</span>`; return; }
  if (!s.configured) { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Not configured — manual trigger is disabled (env vars not set).</span>`; return; }
  $("#trig").innerHTML = `<button id="open-run">Run harvest now</button>`;
  document.body.insertAdjacentHTML("beforeend", `<div id="run-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="run-title"><div class="modal-box">
   <h2 id="run-title">Run harvest now — Cycle ${c.number}</h2><p class="muted">Harvests the Cycle ${c.number} boards now and creates Cycle ${c.number + 1}.</p>
   <label>Passphrase<br><input id="sec" type="password" autocomplete="off"></label><label>Type <b>RUN</b> to confirm<br><input id="cf" size="18"></label>
   <p id="trigmsg" class="msg" aria-live="polite"></p><div class="actions"><button id="cancel" class="secondary">Cancel</button><button id="go" disabled>Run harvest</button></div></div></div>`);
  const m = $("#run-modal"), msg = $("#trigmsg"), close = () => { m.hidden = true; };
  const valid = () => { $("#go").disabled = !($("#sec").value && $("#cf").value.trim() === "RUN"); };
  $("#open-run").onclick = () => { m.hidden = false; msg.textContent = ""; msg.className = "msg"; $("#sec").focus(); };
  $("#cancel").onclick = close; m.onclick = (e) => { if (e.target === m) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  $("#sec").oninput = valid; $("#cf").oninput = valid;
  $("#go").onclick = async () => {
    $("#go").disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
    try {
      const r = await fetch("/api/trigger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: $("#sec").value, confirm: $("#cf").value.trim() }) });
      const j = await r.json().catch(() => ({}));
      msg.className = "msg " + (r.ok ? "ok" : "err");
      msg.textContent = r.ok ? (j.message || "Harvest started — the new cycle will appear here when done.") : `Failed: ${j.error || "HTTP " + r.status}`;
    } catch (e) { msg.className = "msg err"; msg.textContent = "Failed: network error"; }
    valid();
  };
}
