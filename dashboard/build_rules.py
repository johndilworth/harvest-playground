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
<meta name="robots" content="noindex,nofollow"><title>Harvest · Rules</title><link rel="stylesheet" href="/styles.css">
<style>.rules{{max-width:1100px}}.rules pre{{background:#F2F3F5;border:1px solid #d5d8dc;padding:12px;overflow:auto;font-size:13px}}.rules code{{font-size:13px}}.rules table{{margin:8px 0 12px}}</style></head>
<body><header class="top"><b>Harvest</b><nav><a href="/">All projects</a><a href="/rules.html">Harvest rules</a></nav></header>
<main class="rules"><p class="muted">Generated from <a href="{G}/blob/main/docs/HARVEST-RULES.md">docs/HARVEST-RULES.md</a> · <a href="#code">Code</a></p>
{body}
{code}
</main></body></html>
"""
(root / "dashboard/public/rules.html").write_text(html)
print("wrote rules.html", len(html))
