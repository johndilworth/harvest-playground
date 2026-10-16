"""Render docs/HARVEST-RULES.md -> dashboard/public/rules.html. Usage: python3 dashboard/build_rules.py"""
import pathlib, markdown
root = pathlib.Path(__file__).resolve().parent.parent
md = (root / "docs/HARVEST-RULES.md").read_text()
md = md.replace("](../HARVEST.md)", "](https://github.com/johndilworth/harvest-playground/blob/main/HARVEST.md)")
body = markdown.markdown(md, extensions=["tables", "fenced_code", "toc"])
G = "https://github.com/johndilworth/harvest-playground"
code = f"""<h2 id="code">Code</h2><div class="card"><ul>
<li><a href="{G}/tree/main/dashboard">Dashboard code</a> (<code>dashboard/</code>)</li>
<li><a href="{G}/blob/main/dashboard/netlify/functions/trigger.mjs">Trigger function</a> (<code>/api/trigger</code>: Run harvest now + New project)</li>
<li><a href="{G}/tree/main/dashboard/public/data">Data files</a> · live: <a href="/data/projects.json">projects.json</a>, <a href="/data/harvest-playground.json">harvest-playground.json</a>, <a href="/data/design-loop.json">design-loop.json</a>, <a href="/data/harvest-site.json">harvest-site.json</a>, <a href="/data/harvest-dashboard.json">harvest-dashboard.json</a></li>
<li><a href="{G}/blob/main/docs/HARVEST-RULES.md">Generic rules doc</a> (<code>docs/HARVEST-RULES.md</code>, source of this page)</li>
<li><a href="{G}/blob/main/HARVEST.md">Harvest Playground project rules</a> (<code>HARVEST.md</code>)</li>
</ul></div>"""
html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Harvest · Rules</title><script src="/theme.js"></script><link rel="stylesheet" href="/styles.css">
<style>.rules{{max-width:1100px}}.rules pre{{background:var(--surface);border:1px solid var(--border);padding:12px;overflow:auto;font-size:13px}}.rules code{{font-size:13px}}.rules table{{margin:8px 0 12px}}</style></head>
<body><header class="top"><b>Harvest</b><nav><a href="/">All projects</a><a href="/rules.html">Harvest rules</a></nav><button type="button" class="theme-toggle" aria-label="Toggle dark mode"><svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></g></svg><svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg></button></header>
<main class="rules"><p class="muted">Generated from <a href="{G}/blob/main/docs/HARVEST-RULES.md">docs/HARVEST-RULES.md</a> · <a href="#code">Code</a></p>
{body}
{code}
</main></body></html>
"""
(root / "dashboard/public/rules.html").write_text(html)
print("wrote rules.html", len(html))
