#!/usr/bin/env node
// Capture the playground page for a Harvest cycle at 1440x1024.
// Usage (from journey/): node capture.mjs --cycle N [--base-url URL] [--out out/cN]
// Writes 01-home.png (viewport, first screen) and, when the page is taller than one viewport,
// 02-home-full.png (full page). With --all yes it also captures the other flow pages
// (03-dinosaur.png + 03-dinosaur-full.png, 04-random.png + 04-random-full.png). Prints a JSON summary to stdout.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const a = Object.fromEntries(process.argv.slice(2).reduce((acc, x, i, arr) => {
  if (x.startsWith('--')) acc.push([x.slice(2), arr[i + 1]]); return acc }, []))
const cycle = Number(a.cycle ?? 0)
const base = (a['base-url'] || 'https://harvest-playground.netlify.app').replace(/\/$/, '')
const out = path.resolve(a.out || `out/c${cycle}`)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
await page.goto(base + '/', { waitUntil: 'networkidle' })
const height = await page.evaluate(() => document.documentElement.scrollHeight)
const files = []
await page.screenshot({ path: path.join(out, '01-home.png') }); files.push('01-home.png')
if (height > 1024) { await page.screenshot({ path: path.join(out, '02-home-full.png'), fullPage: true }); files.push('02-home-full.png') }
const h1 = await page.locator('h1').first().textContent()
const footer = await page.locator('footer').first().textContent()
const extra = {}
if (a.all) {
  for (const [key, route] of [['03-dinosaur', '/dinosaur.html'], ['04-random', '/random.html']]) {
    await page.goto(base + route, { waitUntil: 'networkidle' })
    const hh = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.screenshot({ path: path.join(out, key + '.png') }); files.push(key + '.png')
    if (hh > 1024) { await page.screenshot({ path: path.join(out, key + '-full.png'), fullPage: true }); files.push(key + '-full.png') }
    extra[key] = { route, height: hh, h1: (await page.locator('h1').first().textContent())?.trim(), footer: (await page.locator('footer').first().textContent())?.trim() }
  }
}
await browser.close()
const summary = { cycle, base, height, files, h1: h1?.trim(), footer: footer?.trim(), pages: extra, capturedAt: new Date().toISOString() }
fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify(summary))
