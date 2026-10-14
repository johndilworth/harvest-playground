const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Denver" });
const SLUG = (location.pathname.match(/^\/p\/([a-z0-9-]+)/) || [])[1] || "harvest-playground";
const B = `/p/${SLUG}/`;
// Top header: brand + All projects + Harvest rules only (no project name). Project links live in title-row subnav.
const nav = () => `<header class="top"><b><a href="/" style="color:inherit">Harvest</a></b><nav><a href="/">All projects</a><a href="/rules.html">Harvest rules</a></nav></header>`;
function subnav(p, current) {
  const items = [
    ["Dashboard", B, "dash"],
    ["Summary", `${B}summary.html`, "summary"],
  ];
  if (p.site) items.push(["Live site ↗", p.site, "live"]);
  // History dropped from project subnav (cycle-1 sticky); navigation is a shared component.
  return `<nav class="subnav" aria-label="Project">${items.map(([label, href, key]) =>
    key === current ? `<a class="current" href="${href}" aria-current="page">${esc(label)}</a>` : `<a href="${href}">${esc(label)}</a>`
  ).join("")}</nav>`;
}
/** Title row: h1 on the left, project subnav on the right (shared on dashboard / cycle / summary). */
function titleRow(titleHtml, p, current) {
  return `<div class="title-row"><h1>${titleHtml}</h1>${subnav(p, current)}</div>`;
}
async function load(slug = SLUG) { const r = await fetch(`/data/${slug}.json`, { cache: "no-store" }); if (!r.ok) throw new Error("Unknown project " + slug); return r.json(); }
const isNightly = (p) => p.harvestMode === "nightly";
const runsLabel = (p) => (isNightly(p) ? "Nightly harvests" : "Manual harvests");
const runs = (p, c) => (isNightly(p) ? c.nightlyHarvests : c.manualHarvests) || [];
const ordered = (cs) => [...cs].sort((a, b) => (b.status === "current") - (a.status === "current") || b.number - a.number);

async function dashboard() {
  const d = await load(), p = d.project, cs = d.cycles, cur = cs.find((c) => c.status === "current");
  const applied = cs.reduce((n, c) => n + c.changes.applied.length, 0), skipped = cs.reduce((n, c) => n + c.changes.skipped.length, 0);
  document.body.insertAdjacentHTML("afterbegin", nav());
  $("main").innerHTML = `${titleRow(esc(p.name), p, "dash")}<p class="muted">${esc(p.description)}</p>
  ${histogram(cs)}
  <div class="chips"><span class="chip"><b>${cs.length}</b> cycles</span><span class="chip"><b>${d.stats.pullRequests}</b> PRs</span><span class="chip"><b>${applied}</b> stickies applied</span><span class="chip"><b>${isNightly(p) ? d.stats.nightlyHarvests : d.stats.manualHarvests ?? 0}</b> ${isNightly(p) ? "nightly" : "manual"} harvests</span></div>
  <h2>Cycles</h2><div class="stack" id="cycle-stack" role="list" aria-label="Cycles, current in front">${[...ordered(cs)].reverse().map((c) => `<a role="listitem" class="card cycle-card stack-card ${c.status}" href="${B}cycle.html?c=${c.number}" data-cycle="${c.number}">
   <h3>Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>`}</h3>
   <div class="muted">${fmt(c.createdAt)} · ${c.documents.length} Lucid docs · ${c.changes.applied.length} applied · ${authorsTotal(c)} stickies by ${authorsCount(c)} author(s)</div><div>${esc(c.title)}</div>
   <img src="${c.screenshot}" alt="Cycle ${c.number} home screenshot" loading="lazy"></a>`).join("")}</div>
  <p class="muted">Data: <a href="/data/${SLUG}.json">${SLUG}.json</a> · updated ${fmt(d.updatedAt)}${p.rules ? ` · <a href="${p.rules}">Project rules ↗</a>` : ""} · ${skipped} skipped overall</p>`;
  setupHistogram();
  setupCycleStack();
}

function docIdFromUrl(url) {
  const m = String(url || "").match(/\/(?:lucidchart|lucidspark)\/([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}
function docsHtml(docs, status, shot) {
  if (!docs.length) return `<p class="muted">No Lucid documents.</p>`;
  return `<p class="note-signin">Sign in to Lucid with your company account to comment — your name appears on your stickies.</p>
  <div class="doc-grid">${docs.map((x) => {
    const comment = x.commentUrl || x.url || "#";
    return `<div class="doc-tile">
      <div class="emb">${shot
        ? `<img src="${esc(shot)}" alt="Cycle screenshot (static preview)" loading="lazy">`
        : `<div class="ph"><img src="/lucidchart-logo.svg" alt="" width="134" height="22"></div>`}</div>
      <div class="meta"><b>${esc(x.title)}</b><span class="tag">${"flow: " + esc(x.flow)}</span>
        <div class="muted">${esc(x.description || "")}${status === "current" ? " · open for stickies" : " · harvested"}</div>
        <div class="doc-actions"><a class="btn-comment" href="${esc(comment)}" target="_blank" rel="noopener">Open board to comment</a>
        ${x.url && x.commentUrl ? `<a class="small" href="${esc(x.url)}" target="_blank" rel="noopener">Edit link</a>` : ""}</div></div></div>`;
  }).join("")}</div>`;
}
function changesHtml(ch) {
  const has = ch.applied.length || ch.skipped.length || ch.conflicts.length || ch.note;
  if (!has) return "";
  return `<h2>Changes made in this cycle (${ch.applied.length} applied, ${ch.skipped.length} skipped)</h2><div class="card">
   ${ch.note ? `<p>${esc(ch.note)}</p>` : ""}${ch.applied.length ? `<ul>${ch.applied.map((a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.flow)} — ${esc(a.text)}${a.author ? ` · by ${esc(a.author)}` : ""}</li>`).join("")}</ul>` : ""}
   ${ch.skipped.length ? `<p><b>Skipped</b></p><ul>${ch.skipped.map((s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i>${s.author ? ` · by ${esc(s.author)}` : ""}</li>`).join("")}</ul>` : ch.applied.length ? "" : "<p class='muted'>Skipped: none</p>"}
   ${ch.conflicts.length ? `<p><b>Conflicts</b></p><ul>${ch.conflicts.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>`;
}
function authorsSection(c) {
  if (!(c.authors || []).length) return "";
  return `<h2>Sticky authors</h2><div class="card">${authorsHtml(c)}</div>`;
}

async function cycle() {
  const d = await load(), n = +new URLSearchParams(location.search).get("c"), c = d.cycles.find((x) => x.number === n) || ordered(d.cycles)[0];
  document.body.insertAdjacentHTML("afterbegin", nav()); document.title = `Cycle ${c.number} · ${d.project.name}`;
  const ch = c.changes;
  const curC = d.cycles.find((x) => x.status === "current");
  const cycleTitle = `<a href="${B}">${esc(d.project.name)}</a> · Cycle ${c.number}${c.status === "current" ? '<span class="tag current">Current</span>' : `<span class="tag">${esc(c.status)}</span>${curC ? ` <a class="small" style="font-size:14px;font-weight:normal" href="${B}cycle.html?c=${curC.number}">Go to current cycle (Cycle ${curC.number}) →</a>` : ""}`}`;
  $("main").innerHTML = `${titleRow(cycleTitle, d.project, "cycle")}
  <p class="muted">${esc(c.title)} · created ${fmt(c.createdAt)}${c.harvestedFrom != null ? ` · harvested from Cycle ${c.harvestedFrom}` : ""}${c.pullRequest ? ` · <a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""} · commit <code>${esc(c.commit)}</code>${c.previewUrl ? ` · <a class="preview" href="${c.previewUrl}">Preview ↗</a>` : ""}</p>
  <h2>Lucid documents</h2>${docsHtml(c.documents, c.status, c.screenshot)}
  ${changesHtml(ch)}
  ${authorsSection(c)}
  <h2 id="nightly">${runsLabel(d.project)}</h2><div class="card">${c.status === "current" && d.project.trigger ? `<p class="muted">Harvests this cycle's boards immediately and creates Cycle ${c.number + 1}.${isNightly(d.project) ? " Normally runs at 5 pm MT." : " This project has no nightly routine; harvests run only when triggered."}</p><div id="trig"><button disabled>Checking…</button></div>` : ""}${runs(d.project, c).length ? `<ul>${runs(d.project, c).map((h) => `<li>${esc(h.date)} — ${h.stickies} stickies (${esc(h.outcome)})</li>`).join("")}</ul>` : `<p class='muted'>None yet${isNightly(d.project) ? " — next harvest at 5 pm MT" : c.status === "current" ? " — harvested manually when requested" : ""}.</p>`}</div>
  ${cycleNav(d.cycles, c)}`;
  if (c.status === "current" && d.project.trigger) setupTrigger(c);
}

async function summary() {
  const d = await load(); document.body.insertAdjacentHTML("afterbegin", nav());
  const li = (a, f) => a.length ? `<ul>${a.map(f).join("")}</ul>` : "<span class='muted'>none</span>";
  $("main").innerHTML = `${titleRow(`<a href="${B}">${esc(d.project.name)}</a> · Summary`, d.project, "summary")}<p class="muted">Every cycle and the changes it shipped.</p>
  <table><tr><th>Cycle</th><th>Date</th><th>Status</th><th>Applied</th><th>Skipped (reason)</th><th>Conflicts</th></tr>
  ${[...d.cycles].sort((a, b) => b.number - a.number).map((c) => `<tr><td><a href="${B}cycle.html?c=${c.number}">Cycle ${c.number}</a>${c.pullRequest ? `<br><a href="${c.pullRequest}">PR #${c.pullRequest.split("/").pop()}</a>` : ""}</td>
   <td style="white-space:nowrap">${fmt(c.createdAt)}</td><td>${esc(c.status)}</td>
   <td>${c.changes.note ? esc(c.changes.note) : ""}${c.changes.applied.length || !c.changes.note ? li(c.changes.applied, (a) => `<li><b>${esc(a.priority)}</b> · ${esc(a.text)}${a.author ? ` · by ${esc(a.author)}` : ""}</li>`) : ""}</td>
   <td>${li(c.changes.skipped, (s) => `<li>${esc(s.text)} — <i>${esc(s.reason)}</i>${s.author ? ` · by ${esc(s.author)}` : ""}</li>`)}</td>
   <td>${li(c.changes.conflicts, (s) => `<li>${esc(s)}</li>`)}</td></tr>`).join("")}</table>`;
}

const authorsTotal = (c) => (c.authors || []).reduce((n, a) => n + a.stickies, 0);
const authorsCount = (c) => (c.authors || []).length;
function allAuthors(cs) { const m = {}; cs.forEach((c) => (c.authors || []).forEach((a) => (m[a.name] = (m[a.name] || 0) + a.stickies))); return Object.entries(m).map(([name, stickies]) => ({ name, stickies })).sort((a, b) => b.stickies - a.stickies); }
function authorsHtml(c) {
  const a = c.authors || [];
  if (!a.length) return `<p class='muted'>${esc(c.authorsNote || "No stickies harvested from these boards yet.")}</p>`;
  return `<table class="authors"><tr><th>Author</th><th>Stickies</th></tr>${a.map((x) => `<tr><td>${esc(x.name)}</td><td>${x.stickies}</td></tr>`).join("")}</table><p class="muted">“anonymous” = the sticky had no author attribution.</p>`;
}
function cycleNav(cs, c) {
  const prev = cs.find((x) => x.number === c.number - 1), next = cs.find((x) => x.number === c.number + 1);
  if (!prev && !next) return "";
  return `<nav class="cyclenav">${prev ? `<a href="${B}cycle.html?c=${prev.number}">← Cycle ${prev.number}</a>` : "<span></span>"}${next ? `<a href="${B}cycle.html?c=${next.number}">Cycle ${next.number} →</a>` : "<span></span>"}</nav>`;
}
async function setupTrigger(c) {
  let s;
  try { s = await (await fetch("/api/trigger", { cache: "no-store" })).json(); }
  catch { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Trigger endpoint unavailable.</span>`; return; }
  if (!s.configured) { $("#trig").innerHTML = `<button disabled>Run harvest now</button> <span class="muted">Not configured — manual trigger is disabled (env vars not set).</span>`; return; }
  $("#trig").innerHTML = `<button id="open-run">Run harvest now</button>`;
  document.body.insertAdjacentHTML("beforeend", `<div id="run-modal" class="modal" hidden role="dialog" aria-modal="true" aria-labelledby="run-title"><div class="modal-box">
   <h2 id="run-title">Run harvest now — Cycle ${c.number}</h2><p class="muted">Harvests the Cycle ${c.number} boards now and creates Cycle ${c.number + 1}.</p>
   <label>Passphrase<br><input id="sec" type="password" autocomplete="off"></label>
   <p id="trigmsg" class="msg" aria-live="polite"></p><div class="actions"><button id="cancel" class="secondary">Cancel</button><button id="go" disabled>Run harvest</button></div></div></div>`);
  const m = $("#run-modal"), msg = $("#trigmsg"), close = () => { m.hidden = true; };
  const valid = () => { $("#go").disabled = !$("#sec").value; };
  $("#open-run").onclick = () => { m.hidden = false; msg.textContent = ""; msg.className = "msg"; $("#sec").focus(); };
  $("#cancel").onclick = close; m.onclick = (e) => { if (e.target === m) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  $("#sec").oninput = valid;
  $("#go").onclick = async () => {
    $("#go").disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
    try {
      // Server still expects confirm:"RUN"; UI no longer asks the user to type it.
      const r = await fetch("/api/trigger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project: SLUG, secret: $("#sec").value, confirm: "RUN" }) });
      const j = await r.json().catch(() => ({}));
      msg.className = "msg " + (r.ok ? "ok" : "err");
      msg.textContent = r.ok ? (j.message || "Harvest started — the new cycle will appear here when done.") : `Failed: ${j.error || "HTTP " + r.status}`;
    } catch (e) { msg.className = "msg err"; msg.textContent = "Failed: network error"; }
    valid();
  };
}

// ---- Contributions histogram (one stacked bar per cycle, compressed sqrt scale) ----
const TYPES = [["red", "Must do", "#d1242f"], ["yellow", "Try", "#e3b008"], ["blue", "Consider", "#2f6fdd"], ["purple", "Board feedback", "#8250df"]];
const PRI = { must: "red", try: "yellow", consider: "blue", board: "purple" };
function contrib(c) {
  if (c.contributions) return { red: 0, yellow: 0, blue: 0, purple: 0, ...c.contributions };
  const k = { red: 0, yellow: 0, blue: 0, purple: 0 };
  [...c.changes.applied, ...c.changes.skipped].forEach((x) => { if (PRI[x.priority]) k[PRI[x.priority]]++; });
  return k;
}
const fmtMT = (d) => new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }) + " MT";
function histogram(cs, opts = {}) {
  const H = 140, BASE = 3, list = [...cs].sort((a, b) => b.number - a.number); // newest cycle on the left (matches the cycle list)
  const rows = list.map((c) => { const k = contrib(c); return { c, k, t: TYPES.reduce((n, [t]) => n + k[t], 0) }; });
  const max = Math.max(1, ...rows.map((r) => r.t));
  const h = (n) => (n <= 0 ? 0 : Math.max(4, Math.round((Math.sqrt(n) / Math.sqrt(max)) * (H - 8))));
  const bw = 34, gap = 22, W = rows.length * (bw + gap) + gap;
  const bars = rows.map((r, i) => {
    const x = gap + i * (bw + gap), total = h(r.t);
    let y = H, segs = "";
    TYPES.forEach(([t, , col]) => { if (!r.k[t]) return; const sh = Math.max(1, Math.round(total * r.k[t] / r.t)); y -= sh; segs += `<rect x="${x}" y="${y}" width="${bw}" height="${sh}" fill="${col}"/>`; });
    const per = TYPES.map(([t, l]) => `${r.k[t]} ${l}`).join(", ");
    const tip = `<b>Cycle ${r.c.number}</b><br>${esc(fmtMT(r.c.createdAt))}<br><b>${r.t}</b> contributions${TYPES.map(([t, l, col]) => `<br><i style="background:${col}"></i>${l}: ${r.k[t]}`).join("")}`;
    return `<g class="bar" tabindex="0" role="link" data-href="${B}cycle.html?c=${r.c.number}" style="cursor:pointer" aria-label="Open Cycle ${r.c.number}, harvested ${esc(fmtMT(r.c.createdAt))}: ${r.t} contributions (${per})" data-tip="${esc(tip)}">
      <rect class="hit" x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H + 22}" fill="transparent"/>
      <rect x="${x}" y="${H - BASE}" width="${bw}" height="${BASE}" fill="#9aa1a9"/>${segs}
      <text x="${x + bw / 2}" y="${H + 16}" text-anchor="middle">C${r.c.number}</text></g>`;
  }).join("");
  // No title or key above the chart (cycle-2 sticky): the hover/focus tooltip shows the colour key.
  return `<div class="card histo">
   <div class="histo-wrap"><svg viewBox="0 0 ${W} ${H + 22}" width="${W}" height="${H + 22}" role="group" aria-label="Stickies per cycle, stacked by type (compressed square-root scale)">
   <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#c8ccd1"/>${bars}</svg><div id="tip" class="tip" role="tooltip" hidden></div></div></div>`;
}
function setupHistogram() {
  const tip = $("#tip"), wrap = $(".histo-wrap"); if (!tip) return;
  const show = (g) => { tip.innerHTML = g.dataset.tip; tip.hidden = false; const r = g.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    let left = r.right - w.left + 4; if (left + tip.offsetWidth > w.width) left = r.left - w.left - tip.offsetWidth - 4;
    tip.style.left = Math.max(0, left) + "px"; tip.style.top = "2px"; };
  document.querySelectorAll(".histo .bar").forEach((g) => {
    g.addEventListener("mouseenter", () => show(g)); g.addEventListener("focus", () => show(g));
    g.addEventListener("mouseleave", () => (tip.hidden = true));
    g.addEventListener("click", () => (location.href = g.dataset.href));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); location.href = g.dataset.href; } }); g.addEventListener("blur", () => (tip.hidden = true));
  });
}

// ---- Home: all projects ----
async function home() {
  document.body.insertAdjacentHTML("afterbegin", nav()); // shared global nav component
  const idx = await (await fetch("/data/projects.json", { cache: "no-store" })).json();
  const ds = await Promise.all(idx.projects.map((p) => load(p.slug).catch(() => null)));
  // Description under "Harvest projects" removed (cycle 0 sticky).
  $("main").innerHTML = `<div class="doc"><h1>All projects</h1><a class="btn" id="new-project" href="/new.html">+ New project</a></div><div class="grid projects">${idx.projects.map((p, i) => {
    const d = ds[i]; if (!d) return `<div class="card">${esc(p.name)} — data unavailable</div>`;
    const cs = d.cycles, cur = cs.find((c) => c.status === "current") || cs[cs.length - 1];
    const all = cs.flatMap((c) => runs(d.project, c)).map((h) => h.date).sort(); const last = all[all.length - 1];
    return `<a class="card project-card" href="/p/${p.slug}/" style="color:inherit;text-decoration:none">
     <h3>${esc(d.project.name)} <span class="tag">${isNightly(d.project) ? "Nightly" : "Manual"}</span></h3>
     ${spark(cs)}
     <div class="kv"><span><b>${cs.length}</b> cycles</span><span>current <b>Cycle ${cur.number}</b></span><span>last harvest <b>${last ? esc(fmt(last + "T12:00:00")) : "none yet"}</b></span></div>
     ${cur.screenshot ? `<img src="${cur.screenshot}" alt="${esc(d.project.name)} Cycle ${cur.number} screenshot" loading="lazy">` : ""}</a>`; }).join("")}</div>
  <p class="muted">Index: <a href="/data/projects.json">projects.json</a> · screen captures hosted under <code>/captures/&lt;project&gt;/&lt;flow&gt;/</code></p>`;
}
function spark(cs) {
  const list = [...cs].sort((a, b) => b.number - a.number).map((c) => { const k = contrib(c); return { n: c.number, k, t: TYPES.reduce((n, [t]) => n + k[t], 0) }; });
  const max = Math.max(1, ...list.map((r) => r.t)), H = 36, bw = 12, gap = 6;
  const bars = list.map((r, i) => { let y = H; const x = i * (bw + gap); const th = r.t ? Math.max(3, Math.round(Math.sqrt(r.t / max) * H)) : 0;
    let g = `<rect x="${x}" y="${H - 2}" width="${bw}" height="2" fill="#9aa1a9"/>`;
    TYPES.forEach(([t, , col]) => { if (!r.k[t]) return; const h = Math.max(1, Math.round(th * r.k[t] / r.t)); y -= h; g += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${col}"/>`; });
    return `<g><title>Cycle ${r.n}: ${r.t} contributions</title>${g}</g>`; }).join("");
  return `<svg class="spark" width="${list.length * (bw + gap)}" height="${H}" role="img" aria-label="Contributions per cycle">${bars}</svg>`;
}

// ---- Cycle card stack (faithful port of ProductTile / framer-motion spring) ----
function setupCycleStack() {
  const stack = document.getElementById("cycle-stack");
  if (!stack) return;
  const cards = [...stack.querySelectorAll(".stack-card")];
  if (!cards.length) return;

  // Reference: CARD_WIDTH=200; scale our tile width proportionally and keep ratios.
  const CARD_WIDTH = 220;
  const STACK_OFFSET = Math.floor(CARD_WIDTH * 0.5);
  const REVEAL_OVERLAP = Math.round(90 * (CARD_WIDTH / 200));
  const STIFFNESS = 300, DAMPING = 30, MASS = 1;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  stack.style.setProperty("--card-w", CARD_WIDTH + "px");
  cards.forEach((el) => { el.style.width = CARD_WIDTH + "px"; });

  // Measure natural height after width applied, then size the stage.
  let maxH = 0;
  cards.forEach((el) => { maxH = Math.max(maxH, el.offsetHeight); });
  const stageH = Math.ceil(maxH * 1.05) + 16;
  stack.style.height = stageH + "px";
  // Span of stacked rights + card width (+ room to reveal leftward).
  const span = (cards.length - 1) * STACK_OFFSET + CARD_WIDTH + (CARD_WIDTH - REVEAL_OVERLAP);
  stack.style.minWidth = Math.min(span, stack.parentElement?.clientWidth || span) + "px";

  // Per-card spring state for x and scale (framer-motion spring, mass 1).
  const state = cards.map((el, i) => {
    el.style.right = (i * STACK_OFFSET) + "px";
    el.style.zIndex = String(i + 1); // later in DOM = on top, further left
    return { el, i, x: 0, vX: 0, s: 1, vS: 0, tX: 0, tS: 1 };
  });

  let hovered = null; // index or null
  let raf = 0;

  function targetsFor(h) {
    state.forEach((st) => {
      if (h == null) { st.tX = 0; st.tS = 1; return; }
      st.tX = st.i > h ? -(CARD_WIDTH - REVEAL_OVERLAP) : 0;
      const dist = Math.abs(st.i - h);
      const progressive = Math.max(0.85, 1 - dist * 0.05);
      st.tS = st.i === h ? 1.05 : progressive;
    });
  }

  function applyShadow(h) {
    state.forEach((st) => st.el.classList.toggle("is-hovered", h != null && st.i === h));
  }

  function paint() {
    state.forEach((st) => {
      st.el.style.transform = `translateY(-50%) translateX(${st.x}px) scale(${st.s})`;
    });
  }

  function stepSpring(st, dt) {
    // Semi-implicit Euler matching framer spring (stiffness/damping/mass).
    const ax = (-STIFFNESS * (st.x - st.tX) - DAMPING * st.vX) / MASS;
    st.vX += ax * dt; st.x += st.vX * dt;
    const as = (-STIFFNESS * (st.s - st.tS) - DAMPING * st.vS) / MASS;
    st.vS += as * dt; st.s += st.vS * dt;
    if (Math.abs(st.x - st.tX) < 0.05 && Math.abs(st.vX) < 0.05) { st.x = st.tX; st.vX = 0; }
    if (Math.abs(st.s - st.tS) < 0.0005 && Math.abs(st.vS) < 0.0005) { st.s = st.tS; st.vS = 0; }
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000) || 0.016;
    last = now;
    let moving = false;
    state.forEach((st) => {
      if (reduce) { st.x = st.tX; st.vX = 0; st.s = st.tS; st.vS = 0; }
      else {
        stepSpring(st, dt);
        if (st.x !== st.tX || st.s !== st.tS || st.vX || st.vS) moving = true;
      }
    });
    paint();
    raf = moving && !reduce ? requestAnimationFrame(tick) : 0;
  }

  function kick() {
    if (reduce) { state.forEach((st) => { st.x = st.tX; st.s = st.tS; st.vX = 0; st.vS = 0; }); paint(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function setHovered(h) {
    if (hovered === h) return;
    hovered = h;
    targetsFor(h);
    applyShadow(h);
    kick();
  }

  cards.forEach((el, i) => {
    el.addEventListener("mouseenter", () => setHovered(i));
    el.addEventListener("mouseleave", () => setHovered(null));
    el.addEventListener("focus", () => setHovered(i));
    el.addEventListener("blur", () => {
      requestAnimationFrame(() => { if (!stack.contains(document.activeElement)) setHovered(null); });
    });
  });

  targetsFor(null);
  paint();

  // Remeasure after screenshots load (aspect-ratio helps, but be safe).
  const imgs = cards.map((el) => el.querySelector("img")).filter(Boolean);
  let pending = imgs.filter((img) => !img.complete).length;
  const remeasure = () => {
    let h = 0;
    cards.forEach((el) => { h = Math.max(h, el.offsetHeight); });
    stack.style.height = Math.ceil(h * 1.05) + 16 + "px";
  };
  if (!pending) remeasure();
  else imgs.forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", () => { if (--pending <= 0) remeasure(); }, { once: true });
    img.addEventListener("error", () => { if (--pending <= 0) remeasure(); }, { once: true });
  });
}
