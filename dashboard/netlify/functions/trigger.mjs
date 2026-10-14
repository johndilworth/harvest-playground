// GET  -> { configured }
// POST {action?:"harvest", project, secret, confirm:"RUN"} -> POSTs {project, action:"harvest", source, requestedAt}
// POST {action:"create-project", project:<slug>, setup:{...}, secret, confirm:"CREATE"}
//   -> POSTs {action:"create-project", project, setup, source:"harvest-dashboard", requestedAt}
// Both go to HARVEST_TRIGGER_URL with Authorization: HARVEST_WEBHOOK_AUTH. Unknown actions are rejected.
import { createHash, timingSafeEqual } from "node:crypto";
const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const digest = (s) => createHash("sha256").update(String(s)).digest();
const safeEqual = (a, b) => timingSafeEqual(digest(a), digest(b)); // equal-length digests -> constant time
// Projects whose current cycle page shows "Run harvest now" (must match data/<slug>.json project.trigger)
const PROJECTS = new Set(["harvest-playground", "harvest-dashboard", "design-loop", "harvest-site"]);
// Meeting series whose current meeting page shows "Harvest meeting" (data/meeting-<slug>.json series.trigger)
const MEETINGS = new Set(["team-meeting"]);
const COOLDOWN_MS = 10 * 60 * 1000;
const MAX_BODY = 32 * 1024, MAX_PAYLOAD = 24 * 1024;
const lastTrigger = {}; // per project; best-effort: only holds within a warm function instance

export default async (req) => {
  const url = process.env.HARVEST_TRIGGER_URL, auth = process.env.HARVEST_WEBHOOK_AUTH, secret = process.env.HARVEST_TRIGGER_SECRET;
  const configured = Boolean(url && auth && secret);
  if (req.method === "GET") return json(200, { configured });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (!configured) return json(503, { error: "Trigger not configured (HARVEST_TRIGGER_URL, HARVEST_WEBHOOK_AUTH, HARVEST_TRIGGER_SECRET)." });
  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY) return json(413, { error: "Request too large." });
  let b = {}; try { b = JSON.parse(raw); } catch {}
  if (!b || typeof b !== "object") b = {};
  if (typeof b.secret !== "string" || !safeEqual(b.secret, secret)) return json(401, { error: "Wrong passphrase." });
  const action = b.action ?? "harvest";
  if (action === "harvest") return harvest(b, url, auth);
  if (action === "create-project") return createProject(b, url, auth, req);
  return json(400, { error: "Unknown action." });
};

async function send(url, auth, payload) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: auth }, body: JSON.stringify(payload) });
  return r;
}

async function harvest(b, url, auth) {
  if (b.confirm !== "RUN") return json(400, { error: "Type RUN to confirm." });
  if (b.meeting != null) return harvestMeeting(b, url, auth);
  const project = b.project ?? "harvest-playground";
  if (!PROJECTS.has(project)) return json(400, { error: "Unknown project." });
  const wait = (lastTrigger[project] || 0) + COOLDOWN_MS - Date.now();
  if (wait > 0) return json(429, { error: `A harvest was just started. Try again in ${Math.ceil(wait / 60000)} min.` });
  try {
    const r = await send(url, auth, { project, action: "harvest", source: "harvest-dashboard", requestedAt: new Date().toISOString() });
    if (!r.ok) return json(502, { error: `Harvest webhook rejected the request (HTTP ${r.status}).` });
    lastTrigger[project] = Date.now();
    return json(202, { ok: true, message: "Harvest started — new cycle will appear here when done" });
  } catch { return json(502, { error: "Harvest webhook unreachable." }); }
}

// POST {action:"harvest", meeting:<slug>} -> POSTs {type:"meeting", meeting, action:"harvest", ...}. The downstream routine must handle type "meeting".
async function harvestMeeting(b, url, auth) {
  const meeting = b.meeting;
  if (typeof meeting !== "string" || !MEETINGS.has(meeting)) return json(400, { error: "Unknown meeting series." });
  const key = "meeting:" + meeting, wait = (lastTrigger[key] || 0) + COOLDOWN_MS - Date.now();
  if (wait > 0) return json(429, { error: `A harvest was just started. Try again in ${Math.ceil(wait / 60000)} min.` });
  try {
    const r = await send(url, auth, { type: "meeting", meeting, action: "harvest", source: "harvest-dashboard", requestedAt: new Date().toISOString() });
    if (!r.ok) return json(502, { error: `Harvest webhook rejected the request (HTTP ${r.status}).` });
    lastTrigger[key] = Date.now();
    return json(202, { ok: true, message: "Meeting harvest started — the summary and next meeting will appear here when done" });
  } catch { return json(502, { error: "Harvest webhook unreachable." }); }
}

// ---- create-project: strict whitelist validation; rebuilds a clean setup object (unknown keys dropped) ----
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/, REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/, NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/, PATH_OR_URL = /^(\/|https:\/\/)\S{0,299}$/;
let lastCreate = 0;
function str(v, max, field, errs, { required = false, re } = {}) {
  if (v == null || v === "") { if (required) errs.push(`${field} is required.`); return ""; }
  if (typeof v !== "string") { errs.push(`${field} must be text.`); return ""; }
  const t = v.trim(); if (t.length > max) errs.push(`${field} is too long (max ${max}).`);
  else if (re && t && !re.test(t)) errs.push(`${field} is invalid.`);
  if (required && !t) errs.push(`${field} is required.`);
  return t.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");
}
function validateSetup(project, s) {
  const e = [];
  if (!s || typeof s !== "object" || Array.isArray(s)) return { errors: ["setup is required."] };
  const o = {};
  o.name = str(s.name, 80, "Project name", e, { required: true });
  o.slug = str(s.slug, 48, "Slug", e, { required: true, re: SLUG_RE });
  if (o.slug !== project) e.push("project must equal setup.slug.");
  o.description = str(s.description, 500, "Description", e);
  const repo = s.repo || {};
  if (repo.mode === "existing") o.repo = { mode: "existing", fullName: str(repo.fullName, 140, "Repository", e, { required: true, re: REPO_RE }) };
  else if (repo.mode === "new") o.repo = { mode: "new", name: str(repo.name, 100, "New repo name", e, { required: true, re: NAME_RE }) };
  else e.push("repo.mode must be existing or new.");
  o.branch = str(s.branch, 100, "Branch", e, { re: /^[\w./-]+$/ }) || "main";
  o.baseDir = str(s.baseDir, 200, "Base dir", e, { re: /^[\w./ -]*$/ });
  o.buildCommand = str(s.buildCommand, 300, "Build command", e);
  o.publishDir = str(s.publishDir, 200, "Publish dir", e, { re: /^[\w./ -]*$/ });
  o.liveUrl = str(s.liveUrl, 300, "Live URL", e, { re: /^https:\/\/\S+$/ });
  const n = s.netlify || {}, prev = n.deployPreviews !== false;
  if (n.mode === "existing") o.netlify = { mode: "existing", site: str(n.site, 100, "Netlify site", e, { required: true, re: /^[A-Za-z0-9-]+$/ }), deployPreviews: prev };
  else if (n.mode === "new" || n.mode == null) o.netlify = { mode: "new", deployPreviews: prev };
  else e.push("netlify.mode must be new or existing.");
  const su = Array.isArray(s.startUrls) ? s.startUrls : [];
  if (!su.length || su.length > 20) e.push("1–20 start URLs required.");
  o.startUrls = su.slice(0, 20).map((u, i) => str(u, 300, `Start URL ${i + 1}`, e, { required: true, re: PATH_OR_URL }));
  const fl = Array.isArray(s.flows) ? s.flows : []; if (fl.length > 30) e.push("At most 30 flows.");
  o.flows = fl.slice(0, 30).map((f, i) => ({ name: str(f?.name, 80, `Flow ${i + 1} name`, e, { required: true }),
    startPath: str(f?.startPath, 300, `Flow ${i + 1} start path`, e, { required: true, re: /^\/\S*$/ }), description: str(f?.description, 300, `Flow ${i + 1} description`, e) }));
  const sc = s.schedule || {};
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const DAYS = new Set(["mon","tue","wed","thu","fri","sat","sun"]);
  if (sc.mode === "manual" || sc.mode == null) o.schedule = { mode: "manual" };
  else if (sc.mode === "daily") o.schedule = { mode: "daily", time: str(sc.time, 5, "Daily time", e, { required: true, re: TIME_RE }), timezone: "America/Denver" };
  else if (sc.mode === "weekly") {
    const days = Array.isArray(sc.days) ? sc.days.map((d) => String(d).toLowerCase()).filter((d) => DAYS.has(d)) : [];
    if (!days.length) e.push("Pick at least one day of the week.");
    o.schedule = { mode: "weekly", time: str(sc.time, 5, "Weekly time", e, { required: true, re: TIME_RE }), days, timezone: "America/Denver" };
  } else if (sc.mode === "nightly") // legacy alias → daily (weekdays-only kept via weekends:false)
    o.schedule = { mode: "nightly", time: str(sc.time, 5, "Nightly time", e, { required: true, re: TIME_RE }), timezone: "America/Denver", weekends: sc.weekends === true };
  else e.push("schedule.mode must be manual, daily, weekly, or nightly.");
  o.mergePolicy = s.mergePolicy === "pr-approval" ? "pr-approval" : s.mergePolicy == null || s.mergePolicy === "auto-merge-safe" ? "auto-merge-safe" : (e.push("Invalid mergePolicy."), "");
  const rv = Array.isArray(s.reviewers) ? s.reviewers : []; if (rv.length > 25) e.push("At most 25 reviewers.");
  o.reviewers = rv.slice(0, 25).map((m, i) => str(m, 254, `Reviewer ${i + 1}`, e, { required: true, re: EMAIL_RE }).toLowerCase());
  o.notify = "John via Grok Bot chat"; // fixed
  return { errors: e, setup: o };
}
async function createProject(b, url, auth, req) {
  if (b.confirm !== "CREATE") return json(400, { error: "Type CREATE to confirm." });
  const project = typeof b.project === "string" ? b.project : "";
  if (!SLUG_RE.test(project) || project.length > 48) return json(400, { error: "Invalid project slug." });
  const { errors, setup } = validateSetup(project, b.setup);
  if (errors.length) return json(400, { error: errors.slice(0, 5).join(" ") });
  if (PROJECTS.has(project)) return json(409, { error: "A project with this slug already exists." });
  try { // uniqueness vs the deployed index (best effort)
    const idx = await (await fetch(new URL("/data/projects.json", req.url))).json();
    if (idx.projects?.some((p) => p.slug === project)) return json(409, { error: "A project with this slug already exists." });
  } catch {}
  const wait = lastCreate + COOLDOWN_MS - Date.now();
  if (wait > 0) return json(429, { error: `A setup was just started. Try again in ${Math.ceil(wait / 60000)} min.` });
  const payload = { action: "create-project", project, setup, source: "harvest-dashboard", requestedAt: new Date().toISOString() };
  if (JSON.stringify(payload).length > MAX_PAYLOAD) return json(413, { error: "Setup too large." });
  try {
    const r = await send(url, auth, payload);
    if (!r.ok) return json(502, { error: `Harvest webhook rejected the request (HTTP ${r.status}).` });
    lastCreate = Date.now();
    return json(202, { ok: true, message: "Setup started — the project will appear on the home page when ready." });
  } catch { return json(502, { error: "Harvest webhook unreachable." }); }
}
