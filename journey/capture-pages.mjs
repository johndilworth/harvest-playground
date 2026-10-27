#!/usr/bin/env node
// Capture every Harvest Playground page for a cycle at 1440x1024 into per-flow folders.
// Usage (from journey/): node capture-pages.mjs <cycle> [base-url] [out-root]
// Writes <out-root>/c<N>-home/01-home.png + 02-home-full.png, c<N>-dinosaur/…, c<N>-random/… and prints a JSON summary.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const cycle = Number(process.argv[2])
const base = (process.argv[3] || 'https://harvest-playground.netlify.app').replace(/\/$/, '')
const root = path.resolve(process.argv[4] || '../dashboard/public/captures/harvest-playground')
const pages = [['home', '/'], ['dinosaur', '/dinosaur.html'], ['random', '/random.html'], ['parrots', '/parrots.html'], ['rivals', '/rivals.html']]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
const summary = { cycle, base, pages: {}, capturedAt: new Date().toISOString() }
for (const [slug, route] of pages) {
  const dir = path.join(root, `c${cycle}-${slug}`); fs.mkdirSync(dir, { recursive: true })
  await page.goto(base + route + (route.includes('?') ? '&' : '?') + 'cap=' + Date.now(), { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(700)
  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.screenshot({ path: path.join(dir, `01-${slug}.png`) })
  await page.screenshot({ path: path.join(dir, `02-${slug}-full.png`), fullPage: true })
  summary.pages[slug] = { route, h, dir, h1: (await page.locator('h1').first().textContent())?.trim(),
    footer: (await page.locator('#cycle').first().textContent())?.trim() }
}
summary.errors = errors
await browser.close()
console.log(JSON.stringify(summary, null, 1))
