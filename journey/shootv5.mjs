import { chromium } from "playwright";
const base = process.argv[2], out = "/workspace/harvest-dashboard-shots";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1024 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForSelector("#new-project"); await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/v5-01-home-new-button.png` });
await p.click("#new-project"); await p.waitForURL(/new/); await p.waitForTimeout(400);
// validation error: duplicate slug + bad repo + bad email
await p.fill("#name", "Design Loop"); await p.fill("#repo", "not a repo"); await p.fill("#reviewers", "bob@"); await p.click("#review"); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/v5-02-validation-error.png`, fullPage: true });
await p.reload({ waitUntil: "networkidle" });
await p.fill("#name", "Recipe Planner"); await p.fill("#description", "Meal-planning prototype: pick recipes, build a weekly plan and a shopping list.");
await p.fill("#repo", "johndilworth/recipe-planner"); await p.fill("#baseDir", "app"); await p.fill("#buildCmd", "npm run build"); await p.fill("#publishDir", "dist");
await p.fill("#liveUrl", "https://recipe-planner.netlify.app"); await p.fill("#startUrls", "/\n/plan");
await p.click("#addFlow"); await p.click("#addFlow");
const r = await p.$$(".flowrow");
await (await r[0].$(".fname")).fill("Onboarding"); await (await r[0].$(".fpath")).fill("/welcome"); await (await r[0].$(".fdesc")).fill("First run: diet, household size");
await (await r[1].$(".fname")).fill("Weekly plan"); await (await r[1].$(".fpath")).fill("/plan"); await (await r[1].$(".fdesc")).fill("Drag recipes into days, generate list");
await p.check("input[name=schedule][value=nightly]"); await p.fill("#time", "02:30");
await p.fill("#reviewers", "ana@example.com, ben@example.com");
await p.screenshot({ path: `${out}/v5-03-form-filled.png`, fullPage: true });
await p.click("#review"); await p.waitForTimeout(300); await p.fill("#sec", "wrong"); await p.fill("#cf", "CREATE");
await p.screenshot({ path: `${out}/v5-04-confirm-modal.png` });
if (process.argv[3] === "send") { await p.click("#go"); await p.waitForFunction(() => /Failed|started/.test(document.querySelector("#crmsg").textContent)); await p.waitForTimeout(200);
  console.log("msg:", await p.textContent("#crmsg")); await p.screenshot({ path: `${out}/v5-05-wrong-passphrase.png` }); }
console.log("errors:", JSON.stringify(errs)); await b.close();
