// New Harvest project form -> POST /api/trigger {action:"create-project", ...}
(() => {
  const q = (s) => document.querySelector(s), radio = (n) => document.querySelector(`input[name=${n}]:checked`).value;
  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").replace(/[_\s-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/, REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/, NAME_RE = /^[A-Za-z0-9._-]{1,100}$/, EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
  let taken = new Set(), slugEdited = false;
  fetch("/data/projects.json", { cache: "no-store" }).then((r) => r.json()).then((j) => { taken = new Set(j.projects.map((p) => p.slug)); }).catch(() => {});
  q("#name").oninput = () => { if (!slugEdited) q("#slug").value = slugify(q("#name").value); };
  q("#slug").oninput = () => { slugEdited = q("#slug").value !== ""; };
  const sync = () => { q("#repoExisting").hidden = radio("repoMode") !== "existing"; q("#repoNew").hidden = radio("repoMode") !== "new";
    q("#netlifyExisting").hidden = radio("netlifyMode") !== "existing";
    const sch = radio("schedule");
    q("#schedOpts").hidden = sch === "manual";
    q("#daysOpts").hidden = sch !== "weekly"; };
  document.querySelectorAll("input[type=radio]").forEach((r) => (r.onchange = sync)); sync();
  const lines = (s) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  function collect() {
    const v = (id) => q("#" + id).value.trim(), rm = radio("repoMode"), nm = radio("netlifyMode"), sch = radio("schedule");
    return { name: v("name"), slug: v("slug"), description: v("description"),
      repo: rm === "existing" ? { mode: "existing", fullName: v("repo") } : { mode: "new", name: v("newRepo") },
      branch: v("branch") || "main", baseDir: v("baseDir"), buildCommand: v("buildCmd"), publishDir: v("publishDir"), liveUrl: v("liveUrl"),
      netlify: nm === "existing" ? { mode: "existing", site: v("netlifySite"), deployPreviews: q("#previews").checked } : { mode: "new", deployPreviews: q("#previews").checked },
      startUrls: lines(q("#startUrls").value.replace(/,/g, "\n")),
      flowsText: q("#flows").value.trim(), // natural-language flow descriptions (cycle-2 sticky)
      schedule: (() => {
        if (sch === "manual") return { mode: "manual" };
        const time = q("#time").value, tz = "America/Denver";
        if (sch === "daily") return { mode: "daily", time, timezone: tz };
        const days = [...document.querySelectorAll("input[name=day]:checked")].map((x) => x.value);
        return { mode: "weekly", time, days, timezone: tz };
      })(),
      mergePolicy: radio("merge") === "auto" ? "auto-merge-safe" : "pr-approval",
      reviewers: lines(q("#reviewers").value), notify: "John via Grok Bot chat" };
  }
  function validate(s) {
    const e = []; const bad = (id, m) => e.push([id, m]);
    if (!s.name) bad("name", "Project name is required.");
    if (!SLUG_RE.test(s.slug)) bad("slug", "Slug must be lowercase letters, digits and single dashes.");
    else if (taken.has(s.slug)) bad("slug", `Slug “${s.slug}” is already used by an existing project.`);
    if (s.repo.mode === "existing" && !REPO_RE.test(s.repo.fullName)) bad("repo", "Repository must look like owner/name.");
    if (s.repo.mode === "new" && !NAME_RE.test(s.repo.name)) bad("newRepo", "New repo name: letters, digits, . _ - only.");
    if (!NAME_RE.test(s.branch) && !/^[\w./-]{1,100}$/.test(s.branch)) bad("branch", "Invalid branch name.");
    if (s.liveUrl && !/^https:\/\/[^\s]+$/.test(s.liveUrl)) bad("liveUrl", "Live URL must start with https://.");
    if (s.netlify.mode === "existing" && !/^[A-Za-z0-9-]{1,100}$/.test(s.netlify.site)) bad("netlifySite", "Enter the Netlify site name or id.");
    if (!s.startUrls.length) bad("startUrls", "At least one start URL or path is required.");
    else if (s.startUrls.length > 20 || s.startUrls.some((u) => !/^(\/|https:\/\/)\S*$/.test(u))) bad("startUrls", "Start URLs must be paths (/…) or https:// URLs (max 20).");
    if (s.flowsText.length > 4000) bad("flows", "Flow descriptions are too long (max 4000 characters).");
    if ((s.schedule.mode === "daily" || s.schedule.mode === "weekly" || s.schedule.mode === "nightly") && !/^\d\d:\d\d$/.test(s.schedule.time)) bad("time", "Pick a time.");
    if (s.schedule.mode === "weekly" && !(s.schedule.days || []).length) bad("time", "Pick at least one day of the week.");
    const badMail = s.reviewers.filter((m) => !EMAIL_RE.test(m)); if (badMail.length) bad("reviewers", `Invalid email(s): ${badMail.join(", ")}`);
    if (s.reviewers.length > 25) bad("reviewers", "At most 25 reviewers.");
    return e;
  }
  const showErrors = (errs) => {
    document.querySelectorAll(".invalid").forEach((x) => x.classList.remove("invalid")); document.querySelectorAll(".ferr").forEach((x) => x.remove());
    const box = q("#errbox"); box.hidden = !errs.length; if (!errs.length) return;
    box.innerHTML = `<b>Please fix ${errs.length} problem${errs.length > 1 ? "s" : ""}:</b><ul>${errs.map(([, m]) => `<li>${esc(m)}</li>`).join("")}</ul>`;
    errs.forEach(([id, m]) => { const el = q("#" + id); if (!el) return; el.classList.add("invalid"); el.insertAdjacentHTML("afterend", `<p class="ferr">${esc(m)}</p>`); });
    box.scrollIntoView({ block: "start" });
  };
  const summaryHtml = (s) => { const row = (k, v) => `<dt>${k}</dt><dd>${v || '<span class="muted">—</span>'}</dd>`;
    return `<dl>${row("Name", esc(s.name))}${row("Slug", `<code>${esc(s.slug)}</code> → /p/${esc(s.slug)}/`)}${row("Description", esc(s.description))}
    ${row("Repo", s.repo.mode === "existing" ? `existing <code>${esc(s.repo.fullName)}</code>` : `create new <code>johndilworth/${esc(s.repo.name)}</code>`)}
    ${row("Branch / base / build / publish", [s.branch, s.baseDir || "(root)", s.buildCommand || "(none)", s.publishDir || "(default)"].map(esc).join(" · "))}
    ${row("Live URL", esc(s.liveUrl))}${row("Netlify", (s.netlify.mode === "new" ? "create a new site" : `existing site <code>${esc(s.netlify.site)}</code>`) + (s.netlify.deployPreviews ? " · PR previews on" : " · no PR previews"))}
    ${row("Start URL(s)", s.startUrls.map(esc).join("<br>"))}${row("Flows", esc(s.flowsText).replace(/\n/g, "<br>"))}
    ${row("Schedule", s.schedule.mode === "manual" ? "Manual only" : s.schedule.mode === "daily" ? `Daily at ${esc(s.schedule.time)} MT` : s.schedule.mode === "weekly" ? `Weekly (${(s.schedule.days||[]).join(", ")}) at ${esc(s.schedule.time)} MT` : `Nightly at ${esc(s.schedule.time)} MT${s.schedule.weekends ? " incl. weekends" : ", weekdays only"}`)}
    ${row("Merge policy", s.mergePolicy === "auto-merge-safe" ? "Auto-apply & merge safe items" : "Open PR for approval")}
    ${row("Reviewers", s.reviewers.map(esc).join(", "))}${row("Notify", "Results sent to John in Grok Bot chat")}</dl>`; };
  const m = q("#cr-modal"), msg = q("#crmsg"), close = () => { m.hidden = true; }; let current = null;
  const valid = () => { q("#go").disabled = !(q("#sec").value && q("#cf").value.trim() === "CREATE"); };
  q("#f").onsubmit = (e) => { e.preventDefault(); const s = collect(), errs = validate(s); showErrors(errs); if (errs.length) return;
    current = s; q("#summary").innerHTML = summaryHtml(s); msg.textContent = ""; msg.className = "msg"; m.hidden = false; q("#sec").focus(); };
  q("#cancel").onclick = close; m.onclick = (e) => { if (e.target === m) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  q("#sec").oninput = valid; q("#cf").oninput = valid;
  q("#go").onclick = async () => {
    q("#go").disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
    try {
      const r = await fetch("/api/trigger", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create-project", project: current.slug, setup: current, secret: q("#sec").value, confirm: q("#cf").value.trim() }) });
      const j = await r.json().catch(() => ({}));
      msg.className = "msg " + (r.ok ? "ok" : "err");
      msg.textContent = r.ok ? (j.message || "Setup started — the project will appear on the home page when ready.") : `Failed: ${j.error || "HTTP " + r.status}`;
    } catch { msg.className = "msg err"; msg.textContent = "Failed: network error"; }
    valid();
  };
})();
