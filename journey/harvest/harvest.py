#!/usr/bin/env python3
"""Harvest reviewer feedback from a Lucid journey doc into feedback.json.

The Lucid connector is called by the agent (MCP), not by this script. Steps:
  1. fetch(id=DOC, metadata_only=True) -> page_count / page_region_counts
  2. fetch(id=DOC, page_index=N) for every page (or region_index chunks) -> save raw responses
  3. list_document_threads(DOC) -> for each thread list_document_thread_comments -> save as
     [{"threadId":..., "status":..., "created":..., "comments":[...]}]
  4. python3 journey/harvest/harvest.py --doc-id DOC --cycle 1 --fetch raw/p1.json [--fetch raw/p2.json] \
        --threads raw/threads.json --manifest journey/manifest.json --out feedback.json

Frame containment: uses the fetch field `childrenIds` on nodes with shapeType "Frame" /
BlockClass "SparkFrameBlock" (primary), and independently recomputes containment from
`BoundingBox` (fallback / cross-check). Disagreements are reported per item.

Nested parents: Lucid may parent a sticky to the screenshot IMAGE (`img-<stepKey>`, itself a child of the
frame) instead of the frame. childrenIds containment is therefore resolved transitively up to the frame
(`containment.via` names the intermediate parent), so such stickies count as in-frame without a
disagreement warning.

Ignored generated items (cycle >= 2 before/after layout): ids starting with `before-` (previous-cycle reference
panel: box/label/image, or a frame whose id starts with `before-`) and `changes-` ('Changes in this cycle' block).
Stickies placed on a before- panel are NOT in a review frame on older boards (panel above the frame); they land in
`outsideFrames` (with bestOverlap). Since the cycle 5 board rules (R3) the previous-cycle thumbnail sits INSIDE the
review frame: a sticky whose bbox overlaps a `before-img-*` shape by >= 0.5 stays with that frame but gets
`onBeforePanel: true` (R7), so the reviewer's intent (old screenshot vs current one) is confirmed before coding.

Priority (R5): a sticky's TEXT wins over its colour. Only a keyword at the very start counts (case-insensitive):
`Do:` / `Must do` / `Do or Must do` -> must, `Try:` -> try, `Consider:` -> maybe (an optional `test:` prefix is
skipped). Otherwise the fill colour decides: red -> must, yellow -> try, blue -> maybe. Both are recorded
(`textPriority`, `colorPriority`); a disagreement sets `priorityConflict: true` and is listed in `priorityConflicts`.
Schema values stay must/try/maybe (display labels: Do / Must do, Try, Consider).

Board-format feedback (R6): stickies with a purple/violet fill (hue 260-320 deg, e.g. #BA23F6) or any note whose
text starts with `Board:` are about the review board itself. They never enter `frames`/`outsideFrames`; they go to
`boardFeedback` with the review frame they sit in (if any) and the nearest generated board elements. The harvest
is read-only: it never recolours or edits anything in Lucid.

Empty stickies (R8): a sticky with no text (only the reviewer attribution line) is "needs intent". It gets no priority,
never enters `frames[].feedback` / `outsideFrames` / `boardFeedback`, and is listed in `needsIntent` with its frame/stepKey,
fill (colorPriority shown for information only) and author, so the agent asks the reviewer instead of guessing.
The attribution TextArea (`ReadonlyAttributionText`) is never treated as feedback text.
"""
import argparse, json, re, sys, datetime

GENERATED_PREFIXES = ('frame-', 'hdr-', 'img-', 'doc-title', 'arrow-', 'legend-', 'row-title-', 'before-', 'changes-', 'caption-', 'shot-', 'thumb-', 'text-hub-', 'history-')  # ids we create on import
FEEDBACK_CLASSES = {'StickiesStickyNoteBlock': 'sticky', 'TextBlock': 'text', 'DefaultTextBlockNew': 'text',
                    'LucidCardBlock': 'card', 'SparkCalloutSquareBlock': 'callout'}
FRAME_CLASSES = {'SparkFrameBlock'}
ATTRIB_KEY = 'ReadonlyAttributionText'
LABEL_AUTHOR_RE = re.compile(r'(?:^|;)\s{2,}([^;\n]+?)\s*$')
def priority_from_fill(fill):
    """Legend on the board: Red = must, Yellow = try, Blue = maybe (by hue of the sticky fill)."""
    import colorsys
    m = re.match(r'#?([0-9a-f]{6})', (fill or '').lower())
    if not m: return None
    r, g, b = (int(m.group(1)[i:i+2], 16) / 255 for i in (0, 2, 4))
    h, l, sat = colorsys.rgb_to_hls(r, g, b)
    if sat < 0.25: return None
    h *= 360
    if h < 20 or h >= 320: return 'must'
    if 40 <= h < 70: return 'try'
    if 180 <= h < 260: return 'maybe'
    return None

PRIORITY_RE = re.compile(r'^\s*(?:test\s*[:\-]\s*)?(do\s+or\s+must\s+do\b|must\s+do\b|do\s*:|try\s*:|consider\s*:)', re.I)
KEYWORD_PRIORITY = {'do': 'must', 'must do': 'must', 'do or must do': 'must', 'try': 'try', 'consider': 'maybe'}
BOARD_RE = re.compile(r'^\s*board\s*:', re.I)

def text_priority(text):
    m = PRIORITY_RE.match(text or '')
    if not m: return None
    return KEYWORD_PRIORITY[re.sub(r'\s+', ' ', m.group(1).rstrip(': ').lower()).strip()]

def is_board_fill(fill):
    """Purple / violet sticky fill (board-format feedback), e.g. #BA23F6 (hue ~283 deg)."""
    import colorsys
    m = re.match(r'#?([0-9a-f]{6})', (fill or '').lower())
    if not m: return False
    r, g, b = (int(m.group(1)[i:i+2], 16) / 255 for i in (0, 2, 4))
    h, l, sat = colorsys.rgb_to_hls(r, g, b)
    return sat >= 0.25 and 260 <= h * 360 < 320

def edge_distance(a, b):
    dx = max(0, max(a['x'], b['x']) - min(a['x'] + a['w'], b['x'] + b['w']))
    dy = max(0, max(a['y'], b['y']) - min(a['y'] + a['h'], b['y'] + b['h']))
    return (dx * dx + dy * dy) ** .5

ELEMENT_KINDS = (('frame-', 'frame'), ('hdr-', 'frame title/description'), ('img-', 'screenshot'), ('before-', 'before panel'),
                 ('changes-', 'changes text'), ('legend-', 'legend'), ('doc-title', 'page header'), ('arrow-', 'arrow'),
                 ('row-title-', 'row title'))
def element_kind(i):
    return next((k for p, k in ELEMENT_KINDS if (i or '').startswith(p)), 'other')

def parse_bbox(s):
    if isinstance(s, dict):
        return {k: float(s[k]) for k in ('x', 'y', 'w', 'h')}
    m = dict(re.findall(r'(\w+):\s*(-?[\d.]+)', s or ''))
    return {k: float(m[k]) for k in ('x', 'y', 'w', 'h')} if all(k in m for k in 'xywh') else None

def walk(o):
    """Yield every dict that looks like a Lucid item (has properties.BlockClass) anywhere in fetch data."""
    if isinstance(o, dict):
        if isinstance(o.get('properties'), dict) and 'BlockClass' in o['properties']:
            yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)

def norm(item, page):
    p = item['properties']
    tas = p.get('TextAreas') or []
    # The sticky author line (ReadonlyAttributionText, e.g. "  John Dilworth") is not feedback text (R8). The node `label`
    # is "<text>;   <author>", so it is only used when there is no TextArea and the author suffix is stripped.
    author = next((t.get('text', '').strip() for t in tas if t.get('key') == ATTRIB_KEY), None) or None
    text = '\n'.join(t.get('text', '') for t in tas if t.get('text') and t.get('key') != ATTRIB_KEY)
    if not text and not any(t.get('key') == 'Text' for t in tas):
        text = item.get('label') or item.get('text') or ''
        if author and text.rstrip().endswith(author):
            text = text.rstrip()[:-len(author)].rstrip().rstrip(';')
        elif p.get('BlockClass') == 'StickiesStickyNoteBlock':
            m = LABEL_AUTHOR_RE.search(text)   # connector label form "<text>;   <author>" (semicolon + 3 spaces)
            if m: author, text = m.group(1).strip(), text[:m.start()]
    # Oct 2026 connector variant: a page whose only frame has no connectors comes back with the frame under
    # data.containers.childContainers[] as {containerId, label, properties, itemIds} instead of a Frame node with childrenIds.
    return {'id': item.get('id') or item.get('itemId') or item.get('containerId'), 'blockClass': p.get('BlockClass'),
            'shapeType': item.get('shapeType') or ('Frame' if item.get('containerId') and p.get('BlockClass') in FRAME_CLASSES else None),
            'text': text, 'bbox': parse_bbox(p.get('BoundingBox')), 'fill': p.get('FillColor'),
            'childrenIds': item.get('childrenIds') or (item.get('itemIds') if item.get('containerId') else None),
            'pageId': page.get('pageId'), 'pageTitle': page.get('pageTitle'), 'author': author}

def overlap_ratio(a, f):
    ix = max(0, min(a['x'] + a['w'], f['x'] + f['w']) - max(a['x'], f['x']))
    iy = max(0, min(a['y'] + a['h'], f['y'] + f['h']) - max(a['y'], f['y']))
    area = a['w'] * a['h'] or 1
    return ix * iy / area

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--doc-id', required=True); ap.add_argument('--cycle', type=int, required=True)
    ap.add_argument('--fetch', action='append', required=True); ap.add_argument('--threads')
    ap.add_argument('--manifest', required=True); ap.add_argument('--out', default='feedback.json')
    ap.add_argument('--min-overlap', type=float, default=0.5)
    a = ap.parse_args()

    manifest = json.load(open(a.manifest))
    steps = {e['stepKey']: e for e in manifest['entries'] if e['cycle'] == a.cycle}
    items = {}
    for fp in a.fetch:
        raw = json.load(open(fp))
        data = json.loads(raw['text']) if isinstance(raw.get('text'), str) else raw
        for page in data.get('pages', []):
            for it in walk(page):
                n = norm(it, page)
                items[n['id']] = n

    frames = [n for n in items.values() if (n['blockClass'] in FRAME_CLASSES or n['shapeType'] == 'Frame')
              and not (n['id'] or '').startswith('before-')]
    def step_for_frame(f):
        if f['id'].startswith('frame-') and f['id'][6:] in steps:
            return f['id'][6:], 'frame-id'
        key = f['text'].split(' · ')[0].strip()  # visible title "stepKey · route · title"
        return (key, 'frame-title') if key in steps else (None, 'unmatched')
    frame_info = {}
    for f in frames:
        sk, how = step_for_frame(f)
        frame_info[f['id']] = {'frameId': f['id'], 'frameTitle': f['text'], 'stepKey': sk, 'matchedBy': how, 'pageId': f['pageId'],
                               'bbox': f['bbox'], 'childrenIds': f['childrenIds'] or []}
    # direct parent of every item that appears in any childrenIds list (frames, images, groups ...)
    direct_parent = {c: n['id'] for n in items.values() for c in (n['childrenIds'] or [])}
    def frame_ancestor(item_id):
        """Walk childrenIds parents up to a review frame -> (frameId, via-parent-or-None)."""
        seen, cur, via = set(), item_id, None
        while cur in direct_parent and cur not in seen:
            seen.add(cur); par = direct_parent[cur]
            if par in frame_info:
                return par, via
            via = par; cur = par
        return None, None

    before_imgs = [n for n in items.values() if (n['id'] or '').startswith('before-img-') and n['bbox']]
    board_elems = [n for n in items.values() if (n['id'] or '').startswith(GENERATED_PREFIXES) and n['bbox']]
    groups = {fid: [] for fid in frame_info}
    outside, disagreements, board, conflicts, needs_intent = [], [], [], [], []
    for n in items.values():
        if n['blockClass'] not in FEEDBACK_CLASSES or (n['id'] or '').startswith(GENERATED_PREFIXES):
            continue
        by_child, via = frame_ancestor(n['id'])
        ratios = {fid: overlap_ratio(n['bbox'], fi['bbox']) for fid, fi in frame_info.items()
                  if n['bbox'] and fi['bbox'] and fi['pageId'] == n['pageId']}  # pages share a coordinate space
        best = max(ratios, key=ratios.get) if ratios else None
        if best and ratios[best] <= 0: best = None
        by_bbox = best if best and ratios[best] >= a.min_overlap else None
        kind = FEEDBACK_CLASSES[n['blockClass']]
        containment = {'childrenIds': by_child, 'via': via, 'bbox': by_bbox,
                       'bestOverlap': {'frameId': best, 'ratio': round(ratios[best], 3)} if best else None}
        assigned = by_child or by_bbox
        if kind == 'sticky' and not n['text'].strip():   # R8: empty sticky = needs intent, never a priority item
            needs_intent.append({'itemId': n['id'], 'kind': kind, 'pageId': n['pageId'], 'frameId': assigned,
                                 'stepKey': frame_info[assigned]['stepKey'] if assigned else None, 'fill': n['fill'],
                                 'colorPriority': priority_from_fill(n['fill']), 'boardColor': is_board_fill(n['fill']),
                                 'author': n.get('author'), 'bbox': n['bbox'], 'containment': containment,
                                 'note': 'empty sticky (no text): ask the reviewer what they meant; no priority, not implemented'})
            continue
        if BOARD_RE.match(n['text']) or (kind == 'sticky' and is_board_fill(n['fill'])):
            near = sorted(((edge_distance(n['bbox'], o['bbox']), o['id']) for o in board_elems
                           if n['bbox'] and o['pageId'] == n['pageId'] and o['id'] != assigned), key=lambda t: t[0])[:3]
            board.append({'itemId': n['id'], 'kind': kind, 'text': n['text'], 'fill': n['fill'], 'pageId': n['pageId'],
                          'boardSource': 'text' if BOARD_RE.match(n['text']) else 'color', 'bbox': n['bbox'], 'frameId': assigned,
                          'nearest': [{'id': i, 'element': element_kind(i), 'distance': round(d, 1)} for d, i in near]})
            continue
        pr_text = text_priority(n['text'])
        pr_color = priority_from_fill(n['fill']) if kind == 'sticky' else None
        fb = {'itemId': n['id'], 'kind': kind, 'text': n['text'],
              'priority': pr_text or pr_color,
              'prioritySource': ('text' if pr_text else 'color' if pr_color else None),
              'textPriority': pr_text, 'colorPriority': pr_color,
              'priorityConflict': bool(pr_text and pr_color and pr_text != pr_color),
              'fill': n['fill'], 'bbox': n['bbox'], 'containment': containment}
        if fb['priorityConflict']:
            conflicts.append({'itemId': n['id'], 'textPriority': pr_text, 'colorPriority': pr_color, 'used': pr_text})
        on_before = [b['id'] for b in before_imgs if n['bbox'] and b['pageId'] == n['pageId']
                     and overlap_ratio(n['bbox'], b['bbox']) >= a.min_overlap]
        if on_before:
            fb['onBeforePanel'] = True
            fb['beforePanel'] = on_before[0]
            fb['note'] = "sticky sits on the previous-cycle thumbnail: confirm it is about the current screen before coding"
        if by_child != by_bbox:
            disagreements.append({'itemId': n['id'], 'childrenIds': by_child, 'bbox': by_bbox})
        (groups[assigned] if assigned else outside).append(fb)

    threads = json.load(open(a.threads)) if a.threads else []
    out = {
        'docId': a.doc_id, 'cycle': a.cycle, 'harvestedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'containmentMethod': 'childrenIds (Frame nodes in fetch) with BoundingBox overlap >= %.2f as cross-check' % a.min_overlap,
        'frames': [], 'outsideFrames': outside, 'containmentDisagreements': disagreements,
        'priorityRule': 'start-of-text keyword (Do:/Must do/Do or Must do -> must, Try: -> try, Consider: -> maybe) wins over fill colour',
        'priorityConflicts': conflicts,
        'boardFeedback': board,
        'needsIntent': needs_intent,
        'comments': {'note': 'list_document_threads returns only threadId/created/status and comments carry no shape anchor; '
                             'comments cannot be mapped to frames via the connector', 'unanchored': threads},
    }
    for fid, fi in sorted(frame_info.items(), key=lambda kv: (kv[1]['pageId'] or '', (kv[1]['bbox'] or {}).get('y', 0), (kv[1]['bbox'] or {}).get('x', 0))):
        e = steps.get(fi['stepKey'], {})
        out['frames'].append({
            'frameId': fid, 'pageId': fi['pageId'], 'frameTitle': fi['frameTitle'], 'stepKey': fi['stepKey'], 'matchedBy': fi['matchedBy'],
            'flow': e.get('flow'), 'route': e.get('route'), 'url': e.get('url'), 'title': e.get('title'), 'h1': e.get('h1'),
            'clicked': ({k: e['clicked'][k] for k in ('role', 'name', 'cssPath')} if e.get('clicked') else None),
            'commit': e.get('commit'), 'screenshot': e.get('annotated') or e.get('screenshot'),
            'feedback': groups[fid]})
    json.dump(out, open(a.out, 'w'), indent=2, ensure_ascii=False)
    on_before = sum(1 for v in groups.values() for x in v if x.get('onBeforePanel'))
    print(f"frames={len(frame_info)} feedback_in_frames={sum(len(v) for v in groups.values())} outside={len(outside)} "
          f"board={len(board)} needsIntent={len(needs_intent)} onBeforePanel={on_before} priorityConflicts={len(conflicts)} "
          f"disagreements={len(disagreements)} threads={len(threads)} -> {a.out}")

if __name__ == '__main__':
    main()
