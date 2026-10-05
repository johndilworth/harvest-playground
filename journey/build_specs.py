#!/usr/bin/env python3
"""Build single-page Lucid Standard Import specs for a Harvest Playground cycle (one board per flow + hub).

Usage: python3 build_specs.py --config cycles/<N>/board-config.json --outdir cycles/<N>
Board rules (prototype-to-lucid-journey-map skill): #F2F3F5 sparkFrame, stroke width 0 (no border), 400 px padding on all
sides, screenshot first, ~360 px gap, caption, plain-text changes, previous-cycle 720x512 thumbnail; text has no boxes or
fills; never sets an image `note`; generous (480 px) horizontal gaps between frames; legend + title at the top of the page.
Hub mode needs flow-board edit URLs (config `flows[].editUrl`), so build flows first, import them, then build the hub.
"""
import argparse, json, html
PAD, GAP, HGAP, FW = 400, 360, 480, 1440
ASSET = 'https://journey-assets-ai-xform.netlify.app'
LEGEND = [('must', '#FF8A80', '#C62828', 'Red', 'Do / Must do', None), ('try', '#FFE066', '#9A7B00', 'Yellow', 'Try', None),
          ('maybe', '#A3E4FF', '#1565C0', 'Blue', 'Consider', None), ('board', '#BA23F6', '#7B1FA2', 'Purple', 'Board format', '#FFFFFF')]
def esc(s): return html.escape(s, quote=False)
def text(id_, x, y, w, h, body, actions=None):
    s = {'id': id_, 'type': 'text', 'boundingBox': {'x': x, 'y': y, 'w': w, 'h': h}, 'text': body}
    if actions: s['actions'] = actions
    return s
def frame(id_, x, y, w, h, title, custom=None):
    s = {'id': id_, 'type': 'sparkFrame', 'boundingBox': {'x': x, 'y': y, 'w': w, 'h': h},
         'style': {'fill': {'type': 'color', 'color': '#F2F3F5'}, 'stroke': {'color': '#F2F3F5', 'width': 0, 'style': 'solid'}}, 'title': title}
    if custom: s['customData'] = [{'key': k, 'value': str(v)} for k, v in custom.items()]
    return s
def image(id_, x, y, w, h, url, link=None, sw=2):
    s = {'id': id_, 'type': 'image', 'boundingBox': {'x': x, 'y': y, 'w': w, 'h': h}, 'image': {'type': 'image', 'url': url},
         'stroke': {'color': '#C9CED8', 'width': sw, 'style': 'solid'}}
    if link: s['actions'] = [{'type': 'url', 'url': link, 'newWindow': True}]
    return s
def legend(suffix, x0):
    out = []
    for i, (k, fill, line, name, label, tc) in enumerate(LEGEND):
        st = {'fill': {'type': 'color', 'color': fill}, 'stroke': {'color': line, 'width': 2, 'style': 'solid'}}
        if tc: st['textColor'] = tc
        out.append({'id': f'legend-{k}-{suffix}', 'type': 'rectangle', 'boundingBox': {'x': x0 + i * 320, 'y': -530, 'w': 260, 'h': 300},
                    'style': st, 'text': f"<p style='font-size:24pt;text-align:center'><b>{name}</b><br>{label}</p>"})
    return out
def flow_spec(cfg, fl):
    N, slug = cfg['cycle'], fl['slug']
    shapes = [text(f'doc-title-{slug}', 0, -860, 4400, 200,
                   f"<p style='font-size:40pt;text-align:left'><b>{esc(cfg['product'])} — Cycle {N} · {esc(fl['name'])}</b><br>"
                   f"<span style='font-size:20pt'>{esc(fl['route'])} · Desktop 1440×1024 (full page) · commit {cfg['commit'][:7]} · "
                   f"<a href=\"{cfg['site']}\">{cfg['site']}</a></span></p>"),
              text(f'legend-box-{slug}', 0, -560, 2600, 360,
                   "<p style='font-size:22pt;text-align:left'><b>How to add anything</b><br>Put a sticky note INSIDE the grey frame below and "
                   "write whatever you want to see on the page. Stickies are harvested at 5pm MT daily; safe requests are applied "
                   "automatically and merged. Start with <b>Do:</b>, <b>Try:</b> or <b>Consider:</b> to set priority (the words win over the "
                   "colour); otherwise the colour counts. Purple = feedback about this board.</p>")] + legend(slug, 2700)
    x = 0
    for i, sc in enumerate(fl['screens'], 1):
        sk = f'{i:02d}-{slug}'; ih = sc['h']
        cap_y = PAD + ih + GAP; ch_y = cap_y + 280
        ch_lines = sc['changes']; ch_h = 90 + 34 * sum(1 + len(l) // 95 for l in ch_lines)
        bl_y = ch_y + ch_h + 40; bi_y = bl_y + 60
        fh = (bi_y + 512 + PAD) if sc.get('before') else (bl_y + 60 + PAD)
        shapes.append(frame(f'frame-{sk}', x, 0, FW + 2 * PAD, fh, f"{sk} · {sc['route']} · {sc['title']} · Leave stickies anywhere in this frame",
                            {'stepKey': sk, 'route': sc['route'], 'cycle': N, 'flow': slug}))
        shapes.append(image(f'shot-{sk}', x + PAD, PAD, FW, ih, sc['url'], cfg['site'].rstrip('/') + sc['route']))
        shapes.append(text(f'caption-{sk}', x + PAD, cap_y, FW, 240,
                           f"<p style='font-size:22pt;text-align:left'><b>{sk} · {esc(sc['title'])}</b>  ·  {esc(sc['route'])}<br>"
                           f"<span style='font-size:16pt'>{esc(sc['caption'])}</span><br><span style='font-size:16pt'>Live: "
                           f"<a href=\"{cfg['site'].rstrip('/') + sc['route']}\">{cfg['site'].rstrip('/') + sc['route']}</a></span></p>"))
        shapes.append(text(f'changes-{sk}', x + PAD, ch_y, FW, ch_h,
                           "<p style='font-size:18pt;text-align:left'><b>Changes in this cycle</b><br><span style='font-size:15pt'>"
                           + '<br>'.join('• ' + esc(l) for l in ch_lines) + '</span></p>'))
        if sc.get('before'):
            shapes.append(text(f'before-label-{sk}', x + PAD, bl_y, FW, 48,
                               f"<p style='font-size:16pt;text-align:left'><b>Cycle {N-1} (before)</b> · reference only</p>"))
            shapes.append(image(f'before-img-{sk}', x + PAD, bi_y, 720, 512, sc['before'], sw=1))
        else:
            shapes.append(text(f'before-label-{sk}', x + PAD, bl_y, FW, 48, "<p style='font-size:16pt;text-align:left'>New this cycle</p>"))
        x += FW + 2 * PAD + HGAP
    return {'version': 1, 'pages': [{'id': slug, 'title': f"Cycle {N} · {fl['name']}", 'shapes': shapes}]}
def hub_spec(cfg):
    N = cfg['cycle']; n = len(cfg['flows'])
    W = n * (FW + 2 * PAD) + (n - 1) * HGAP
    hist = cfg['historyUrl']
    shapes = [text('doc-title-hub', 0, -900, W, 200,
                   f"<p style='font-size:40pt;text-align:left'><b>{esc(cfg['product'])} — Cycle {N} · Hub</b><br><span style='font-size:20pt'>"
                   f"{n} flow boards · Desktop 1440×1024 · commit {cfg['commit'][:7]} · <a href=\"{cfg['site']}\">{cfg['site']}</a> · "
                   f"harvested {esc(cfg['date'])}</span></p>"),
              text('legend-box-hub', 0, -560, 2600, 420,
                   "<p style='font-size:22pt;text-align:left'><b>How it works</b><br>Anyone can add anything. Stickies inside a flow-board "
                   "frame are harvested at 5pm MT daily; safe requests are applied automatically and merged; a new board appears by morning. "
                   "Put stickies on the flow boards (tiles below), not on this hub. Red/yellow/blue set priority; purple = board feedback."
                   f"<br><br><a href=\"{hist}\">Open the History board (every cycle, left → right) →</a></p>",
                   [{'type': 'url', 'url': hist, 'newWindow': True}])] + legend('hub', 2700)
    x = 0
    for i, fl in enumerate(cfg['flows'], 1):
        sc = fl['screens'][0]; url = fl['editUrl']
        shapes.append(frame(f'frame-hub-{fl["slug"]}', x, 0, FW + 2 * PAD, 2600, f"{fl['slug']} · {fl['route']} · {len(fl['screens'])} screen"))
        shapes.append(image(f'thumb-hub-{fl["slug"]}', x + PAD, PAD, FW, 1024, fl['thumb'], url))
        shapes.append(text(f'text-hub-{fl["slug"]}', x + PAD, PAD + 1024 + GAP, FW, 416,
                           f"<p style='font-size:22pt;text-align:left'><b><a href=\"{url}\">{i}. {esc(fl['name'])}</a></b>  ·  {esc(fl['route'])}<br>"
                           f"<span style='font-size:16pt'>{len(fl['screens'])} screen · {esc(fl['blurb'])}</span><br><br>"
                           f"<span style='font-size:18pt'><a href=\"{url}\">Open the Cycle {N} · {esc(fl['name'])} board and add stickies →</a></span></p>",
                           [{'type': 'url', 'url': url, 'newWindow': True}]))
        x += FW + 2 * PAD + HGAP
    return {'version': 1, 'pages': [{'id': 'hub', 'title': f'Cycle {N} hub · {n} flow boards', 'shapes': shapes}]}
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--config', required=True); ap.add_argument('--outdir', required=True)
    ap.add_argument('--hub', action='store_true'); a = ap.parse_args()
    cfg = json.load(open(a.config))
    if a.hub:
        json.dump(hub_spec(cfg), open(f'{a.outdir}/lucid-spec-hub.json', 'w'), indent=1, ensure_ascii=False); print('hub')
    else:
        for fl in cfg['flows']:
            json.dump(flow_spec(cfg, fl), open(f'{a.outdir}/lucid-spec-{fl["slug"]}.json', 'w'), indent=1, ensure_ascii=False); print(fl['slug'])
