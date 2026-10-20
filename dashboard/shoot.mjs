// Headless captures of the dashboard. Usage: node shoot.mjs <baseUrl> <outDir> <prefix> [full|review|meetings] [cycle]
import { chromium } from "playwright";
import fs from "node:fs";
const [base, out, prefix, mode = "full", cycleArg] = process.argv.slice(2);
const cycle = cycleArg != null && cycleArg !== "" ? Number(cycleArg) : 0;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1024 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
async function shot(path, name, { full = true, modal = false } = {}) {
  await p.goto(base + path, { waitUntil: "networkidle" }); await p.waitForTimeout(600);
  if (modal) { await p.waitForSelector("#open-run", { timeout: 8000 }); await p.click("#open-run"); await p.waitForTimeout(300); }
  await p.screenshot({ path: `${out}/${prefix}${name}.png`, fullPage: full });
  console.log(name, p.url(), (await p.title()));
}
if (mode === "review") {
  // Cycle 5+: dashboard, cycle page and summary are one view (/p/<slug>/?c=N&tab=summary).
  await shot("/", "01-home"); await shot("/p/harvest-playground/", "02-project-dashboard");
  await shot(`/p/harvest-playground/?c=${cycle || 6}`, "03-selected-cycle");
  await shot("/p/harvest-dashboard/", "04-run-harvest-modal", { full: false, modal: true });
  await shot("/p/harvest-playground/?tab=summary", "05-summary-tab");
} else if (mode === "meetings") {
  // Meeting pages (added to the Harvest Dashboard review boards in cycle 3, from a cycle-2 board-feedback sticky)
  const idx = await (await fetch(base + "/data/meetings.json")).json();
  for (const [i, m] of idx.meetings.entries()) {
    const d = await (await fetch(base + m.file)).json(); const n = idx.meetings.length > 1 ? `-${m.slug}` : "";
    await shot(`/m/${m.slug}/`, `0${2 * i + 1}-meetings${n}`);
    await shot(`/m/${m.slug}/meeting.html?m=${d.currentMeetingId}`, `0${2 * i + 2}-meeting-current${n}`);
  }
} else {
  await shot("/", "home");
  for (const s of ["harvest-playground", "design-loop", "harvest-site", "harvest-dashboard"]) { await shot(`/p/${s}/`, `${s}`); }
  for (const [s, c] of [["harvest-playground", 4], ["design-loop", 5], ["harvest-site", 2], ["harvest-dashboard", 0]]) await shot(`/p/${s}/cycle.html?c=${c}`, `${s}-cycle-${c}`);
  await shot("/p/design-loop/summary.html", "design-loop-summary");
  await shot("/cycle.html?c=2", "redirect-cycle-2");
}
console.log("errors:", JSON.stringify(errs)); await b.close();
