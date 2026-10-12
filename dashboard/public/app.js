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
  <div class="card"><b>Run harvest now</b><p class="muted">Harvests the current cycle's boards (Cycle ${cur?.number}) immediately and creates the next cycle. Normally runs at 5 pm MT.</p>
   <div id="trig"><button disabled>Checking…</button></div><p id="trigmsg" class="muted"></p></div>
  <h2>Cycles</h2><div class="grid">${ordered(cs).map((c) => `<a class="card cycle-card ${c.status}" href="/cycle.html?c=${c.number}" style="color:inherit;text-decoration:none">
   <h3>Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>`}</h3>
   <div class="muted">${fmt(c.createdAt)} · ${c.documents.length} Lucid docs · ${c.changes.applied.length} applied</div><div>${esc(c.title)}</div>
   <img src="${c.screenshot}" alt="Cycle ${c.number} home screenshot" loading="lazy"></a>`).join("")}</div>
  <p class="muted">Data: <a href="/harvest.json">harvest.json</a> · updated ${fmt(d.updatedAt)} · <a href="${p.rules}">Harvest rules</a> · ${skipped} skipped overall</p>`;
  try {
    const s = await (await fetch("/api/trigger", { cache: "no-store" })).json();
    if (!s.configured) { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Not configured — manual trigger is disabled (HARVEST_TRIGGER_URL not set).</span>`; return; }
    $("#trig").innerHTML = `<input id="sec" type="password" placeholder="Shared secret" autocomplete="off"><input id="cf" placeholder="Type RUN to confirm" size="18"><button id="go">Run harvest now</button>`;
    $("#go").onclick = async () => {
      $("#go").disabled = true; $("#trigmsg").textContent = "Sending…";
      const r = await fetch("/api/trigger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: $("#sec").value, confirm: $("#cf").value.trim() }) });
      const j = await r.json(); $("#trigmsg").textContent = r.ok ? "Harvest requested. The new cycle appears here after the run finishes." : `Failed: ${j.error || "upstream " + j.upstreamStatus}`; $("#go").disabled = false;
    };
  } catch { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Trigger endpoint unavailable.</span>`; }
}

async function cycle() {
  const d = await load(), n = +new URLSearchParams(location.search).get("c"), c = d.cycles.find((x) => x.number === n) || ordered(d.cycles)[0];
  document.body.insertAdjacentHTML("afterbegin", nav(d.project)); document.title = `Cycle ${c.number} · Harvest Playground`;
  const ch = c.changes;
  $("main").innerHTML = `<p><a href="/">← Dashboard</a></p><h1>Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>`}</h1>
  <p class="muted">${esc(c.title)} · created ${fmt(c.createdAt)}${c.harvestedFrom != null ? ` · harvested from Cycle ${c.harvestedFrom}` : ""}${c.pullRequest ? ` · <a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""} · commit <code>${esc(c.commit)}</code></p>
  <h2>Lucid documents</h2>${c.documents.map((x) => `<div class="card doc"><div><b><a href="${x.url}">${esc(x.title)}</a></b><span class="tag">${x.role === "hub" ? "hub" : "flow: " + esc(x.flow)}</span>
   <div class="muted">${esc(x.description)}</div></div><div class="muted" style="white-space:nowrap">${fmt(c.createdAt)} · ${x.role === "hub" ? "not harvested" : c.status === "current" ? "open for stickies" : "harvested"}</div></div>`).join("")}
  <h2>Changes made in this cycle (${ch.applied.length} applied, ${ch.skipped.length} skipped)</h2><div class="card">
   ${ch.note ? `<p>${esc(ch.note)}</p>` : ""}${ch.applied.length ? `<ul>${ch.applied.map((a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.flow)} — ${esc(a.text)}</li>`).join("")}</ul>` : ""}
   ${ch.skipped.length ? `<p><b>Skipped</b></p><ul>${ch.skipped.map((s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i></li>`).join("")}</ul>` : "<p class='muted'>Skipped: none</p>"}
   ${ch.conflicts.length ? `<p><b>Conflicts</b></p><ul>${ch.conflicts.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>
  <h2>Nightly harvests of this cycle's boards</h2><div class="card">${c.nightlyHarvests.length ? `<ul>${c.nightlyHarvests.map((h) => `<li>${esc(h.date)} — ${h.stickies} stickies (${esc(h.outcome)})</li>`).join("")}</ul>` : "<p class='muted'>None yet — next harvest at 5 pm MT.</p>"}</div>
  <h2>Screenshot</h2><img src="${c.screenshot}" alt="" style="max-width:100%;border:1px solid #d5d8dc">`;
}

async function summary() {
  const d = await load(); document.body.insertAdjacentHTML("afterbegin", nav(d.project));
  const li = (a, f) => a.length ? `<ul>${a.map(f).join("")}</ul>` : "<span class='muted'>none</span>";
  $("main").innerHTML = `<h1>Summary of all cycles</h1><p class="muted">Every cycle and the changes it shipped, from CHANGELOG.md / HISTORY.md.</p>
  <table><tr><th>Cycle</th><th>Date</th><th>Status</th><th>Applied</th><th>Skipped (reason)</th><th>Conflicts</th></tr>
  ${[...d.cycles].sort((a, b) => b.number - a.number).map((c) => `<tr><td><a href="/cycle.html?c=${c.number}">Cycle ${c.number}</a>${c.pullRequest ? `<br><a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""}</td>
   <td style="white-space:nowrap">${fmt(c.createdAt)}</td><td>${esc(c.status)}</td>
   <td>${c.changes.note ? esc(c.changes.note) : ""}${c.changes.applied.length || !c.changes.note ? li(c.changes.applied, (a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.text)}</li>`) : ""}</td>
   <td>${li(c.changes.skipped, (s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i></li>`)}</td>
   <td>${li(c.changes.conflicts, (s) => `<li>${esc(s)}</li>`)}</td></tr>`).join("")}</table>`;
}
