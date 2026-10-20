#!/usr/bin/env python3
"""Harvest approval mode (Phase 1): propose -> decide -> apply, plus Lucid write-back labels.

Approval setting lives in dashboard/public/data/projects.json, per project:
  "approval": {"mode": "auto"|"required", "reviewer": "John Dilworth", "auto_approve_low_risk": false}
mode "auto" = today's behaviour (harvest applies safe items directly). mode "required" = propose only; nothing is
coded, merged, PR'd or published until decisions exist.

Commands (all paths explicit; the Lucid connector itself is called by the agent, never by this script):
  mode     --project SLUG                          -> prints auto|required (+ reviewer, auto_approve_low_risk)
  propose  --project SLUG --cycle N --feedback F [--feedback F2] [--carry PREV_PROPOSALS] --out P [--dashboard-copy D]
           builds proposals.json from harvest.py feedback.json files; status pending. Carries over pending/deferred
           items from the previous cycle's proposals (--carry). Interpretation/proposedChange/risk are a heuristic
           first pass: the agent SHOULD refine them (edit the JSON) before reporting to the reviewer.
  summary  --proposals P                           -> numbered chat summary for John (Grok Bot chat)
  decide   --proposals P [--dashboard-copy D] 1=approve 2=reject 3=defer "4=approve:edited instruction" | all=approve
           records decisions (approved/rejected/deferred, optional edited instruction, decidedBy/decidedAt).
  apply    --proposals P --plan OUT                -> writes the apply plan: ONLY approved items (with final instruction).
           The agent then implements exactly those items with the project's existing merge policy (auto-merge or PR).
  mark-applied --proposals P [--dashboard-copy D] --commit SHA [ids...]  -> approved items become applied
  carry    --proposals P --out NEXT                -> deferred + still-pending items, ready to seed next cycle (--carry)
  writeback-js --proposals P [--labels itemId=Status ...] [--feedback F --auto-applied id,id]  -> prints a
           lucid_run_script source that sets HarvestStatus shape data + a 'Harvest: <status>' tag on each sticky and a badge rule (see journey/harvest/lucid-writeback.example.js)
"""
import argparse, datetime, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROJECTS = ROOT / 'dashboard/public/data/projects.json'
DEFAULT_APPROVAL = {'mode': 'auto', 'reviewer': 'John Dilworth', 'auto_approve_low_risk': False}
DECISIONS = {'approve': 'approved', 'approved': 'approved', 'a': 'approved', 'yes': 'approved', 'y': 'approved',
             'reject': 'rejected', 'rejected': 'rejected', 'r': 'rejected', 'no': 'rejected', 'n': 'rejected',
             'defer': 'deferred', 'deferred': 'deferred', 'd': 'deferred', 'later': 'deferred'}
# label text, fill colour (white text on all, readable in light boards)
LABEL_COLORS = {'Pending': '#6E7781', 'Approved': '#1A7F37', 'Applied': '#0969DA', 'Rejected': '#CF222E',
                'Deferred': '#9A6700', 'Skipped': '#57606A'}
STATUS_LABEL = {'pending': 'Pending', 'approved': 'Approved', 'applied': 'Applied', 'rejected': 'Rejected',
                'deferred': 'Deferred', 'skipped': 'Skipped'}
HIGH_RE = re.compile(r'\b(delete|remove|wipe|drop|erase|destroy|password|secret|token|credential|api key|redirect|'
                     r'script|tracker|analytics|pixel|embed|form|collect|payment|login|auth|netlify\.toml|_headers|robots|noindex)\b', re.I)
MED_RE = re.compile(r'\b(layout|redesign|restructure|navigation|nav|page|section|component|move|replace|rename|all|every|'
                    r'image|photo|video|animation|font|theme|dark|colour|color|background)\b', re.I)
UNSAFE_RE = re.compile(r'\b(delete|wipe|erase|destroy|remove)\s+(the\s+)?(whole\s+|entire\s+)?(site|repo|project|production|everything)\b|\b(steal|exfiltrate)\b', re.I)
PRI_LABEL = {'must': 'Do / Must do', 'try': 'Try', 'maybe': 'Consider', 'consider': 'Consider'}
KEYWORD_STRIP = re.compile(r'^\s*(?:test\s*[:\-]\s*)?(do\s+or\s+must\s+do\b|must\s+do\b|do\s*:|try\s*:|consider\s*:|board\s*:)\s*', re.I)

now = lambda: datetime.datetime.now().astimezone().isoformat(timespec='seconds')
load = lambda p: json.load(open(p))

def dump(obj, *paths):
    for p in paths:
        if p:
            pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
            json.dump(obj, open(p, 'w'), indent=2, ensure_ascii=False); open(p, 'a').write('\n')

def approval_for(slug):
    for p in load(PROJECTS).get('projects', []):
        if p['slug'] == slug:
            return {**DEFAULT_APPROVAL, **(p.get('approval') or {})}
    raise SystemExit(f'unknown project {slug}')

def risk_of(text, kind):
    if kind in ('board', 'needs-intent'): return 'low'
    if HIGH_RE.search(text or ''): return 'high'
    if MED_RE.search(text or '') or len(text or '') > 140: return 'med'
    return 'low'

def items_from_feedback(fb):
    """Yield (kind, raw item, frame) for every sticky the harvest found (frames, outside, board, needs intent)."""
    for f in fb.get('frames', []):
        for x in f.get('feedback', []): yield 'product', x, f
    for x in fb.get('outsideFrames', []): yield 'outside', x, None
    for x in fb.get('boardFeedback', []): yield 'board', x, None
    for x in fb.get('needsIntent', []): yield 'needs-intent', x, None

def make_item(kind, x, frame, doc_id, cycle):
    text = (x.get('text') or '').strip()
    body = KEYWORD_STRIP.sub('', text).strip() or text
    pri = x.get('priority')
    where = (frame or {}).get('stepKey') or (frame or {}).get('frameTitle') or x.get('stepKey') or None
    interp = {'product': f"{PRI_LABEL.get(pri, 'Unprioritised')} request for {where or 'the board'}: {body}",
              'outside': f"Sticky outside any review frame (not harvested as a product change unless approved): {body}",
              'board': f"Board-format feedback (changes how the next review board is built, not the product): {body}",
              'needs-intent': 'Empty sticky: reviewer intent unknown'}[kind]
    change = {'product': f"Implement: {body}", 'outside': f"Implement if approved: {body}",
              'board': f"Next board: {body}", 'needs-intent': 'No change; ask the author what they meant'}[kind]
    unsafe = kind in ('product', 'outside') and UNSAFE_RE.search(text or '')
    if unsafe:
        change = f"None recommended: looks unsafe ({unsafe.group(0)!r}, HARVEST-RULES § 5); suggest reject"
    return {'lucidItemId': x.get('itemId'), 'docId': doc_id, 'sourceCycle': cycle, 'kind': kind,
            'stickyText': text, 'author': x.get('author') or 'anonymous', 'priority': pri,
            'frame': where, 'fill': x.get('fill'), 'interpretation': interp, 'proposedChange': change,
            'risk': risk_of(text, kind), 'status': 'pending', 'decision': None}

def cmd_mode(a):
    ap = approval_for(a.project); print(json.dumps(ap))

def cmd_propose(a):
    ap = approval_for(a.project)
    items, seen = [], set()
    if a.carry and pathlib.Path(a.carry).exists():
        for it in load(a.carry).get('items', []):
            if it['status'] in ('pending', 'deferred'):
                it = {**it, 'carriedFrom': it.get('carriedFrom') or it.get('sourceCycle'), 'status': 'pending',
                      'previousDecision': (it.get('decision') or {}).get('decision'), 'decision': None}
                items.append(it); seen.add(it['lucidItemId'])
    for fp in a.feedback:
        fb = load(fp)
        for kind, x, frame in items_from_feedback(fb):
            if x.get('itemId') in seen: continue
            seen.add(x.get('itemId')); items.append(make_item(kind, x, frame, fb.get('docId'), fb.get('cycle', a.cycle)))
    order = {'must': 0, 'try': 1, 'maybe': 2, 'consider': 2}
    items.sort(key=lambda i: (i['kind'] != 'product', order.get(i['priority'], 3)))
    for n, it in enumerate(items, 1):
        it['id'] = f"c{a.cycle}-{n:02d}"; it['n'] = n
        if ap['auto_approve_low_risk'] and it['risk'] == 'low' and it['kind'] == 'product':
            it['status'] = 'approved'
            it['decision'] = {'decision': 'approved', 'by': 'auto (low risk)', 'at': now(), 'instruction': None}
    out = {'schemaVersion': 1, 'project': a.project, 'cycle': a.cycle, 'approval': ap,
           'state': 'waiting' if any(i['status'] == 'pending' for i in items) else 'decided',
           'createdAt': now(), 'decidedAt': None, 'appliedAt': None, 'appliedCommit': None, 'items': items}
    dump(out, a.out, a.dashboard_copy)
    print(f"{len(items)} proposals ({sum(1 for i in items if i.get('carriedFrom') is not None)} carried) -> {a.out}")

def cmd_summary(a):
    p = load(a.proposals)
    print(f"Harvest approval needed — {p['project']} cycle {p['cycle']} ({len(p['items'])} items). Reply per item, "
          f"e.g. \"1 approve, 2 reject, 3 defer, 4 approve: <edited instruction>\" (or \"all approve\").")
    for it in p['items']:
        carry = f" [carried from C{it['carriedFrom']}]" if it.get('carriedFrom') is not None else ''
        st = '' if it['status'] == 'pending' else f" — {it['status']}"
        txt = ' / '.join((it['stickyText'] or '(empty)').split('\n'))
        print(f"{it['n']}. [{it['risk']}] \"{txt}\" · by {it['author']}{carry}{st}\n"
              f"   → {' / '.join(it['proposedChange'].splitlines())}")

def parse_decisions(tokens, items):
    out = {}
    for t in tokens:
        m = re.match(r'^\s*(all|\d+)\s*[=:]\s*([a-z]+)\s*(?::\s*(.+))?$', t, re.I | re.S)
        if not m or m.group(2).lower() not in DECISIONS: raise SystemExit(f'bad decision {t!r} (use N=approve|reject|defer[:instruction])')
        keys = [i['n'] for i in items] if m.group(1).lower() == 'all' else [int(m.group(1))]
        for k in keys: out[k] = (DECISIONS[m.group(2).lower()], (m.group(3) or '').strip() or None)
    return out

def cmd_decide(a):
    p = load(a.proposals); by_n = {i['n']: i for i in p['items']}
    for n, (d, instr) in parse_decisions(a.decisions, p['items']).items():
        if n not in by_n: raise SystemExit(f'no item {n}')
        it = by_n[n]
        if it['status'] == 'applied': continue
        it['status'] = d; it['decision'] = {'decision': d, 'by': a.by, 'at': now(), 'instruction': instr}
    p['state'] = 'waiting' if any(i['status'] == 'pending' for i in p['items']) else 'decided'
    p['decidedAt'] = now() if p['state'] == 'decided' else None
    dump(p, a.proposals, a.dashboard_copy)
    print(json.dumps({s: sum(1 for i in p['items'] if i['status'] == s) for s in STATUS_LABEL}), 'state=' + p['state'])

def cmd_apply(a):
    p = load(a.proposals)
    plan = [{'id': i['id'], 'lucidItemId': i['lucidItemId'], 'kind': i['kind'], 'priority': i['priority'], 'author': i['author'],
             'stickyText': i['stickyText'], 'instruction': (i['decision'] or {}).get('instruction') or i['proposedChange']}
            for i in p['items'] if i['status'] == 'approved']
    dump({'project': p['project'], 'cycle': p['cycle'], 'items': plan,
          'notApplied': [{'id': i['id'], 'status': i['status']} for i in p['items'] if i['status'] != 'approved']}, a.plan)
    print(f"{len(plan)} approved item(s) to apply -> {a.plan}; untouched: "
          + ', '.join(f"{i['id']}={i['status']}" for i in p['items'] if i['status'] != 'approved'))

def cmd_mark_applied(a):
    p = load(a.proposals); ids = set(a.ids)
    for i in p['items']:
        if i['status'] == 'approved' and (not ids or i['id'] in ids): i['status'] = 'applied'
    p['appliedAt'], p['appliedCommit'] = now(), a.commit
    dump(p, a.proposals, a.dashboard_copy); print('applied:', [i['id'] for i in p['items'] if i['status'] == 'applied'])

def cmd_carry(a):
    p = load(a.proposals)
    keep = [i for i in p['items'] if i['status'] in ('pending', 'deferred')]
    dump({**p, 'items': keep}, a.out); print(f'{len(keep)} item(s) carried -> {a.out}')

def cmd_writeback_js(a):
    labels = []
    if a.proposals:
        labels += [{'itemId': i['lucidItemId'], 'status': STATUS_LABEL[i['status']]} for i in load(a.proposals)['items']
                   if i.get('lucidItemId') and (not a.doc_id or i.get('docId') in (None, a.doc_id))]
    if a.feedback:   # auto mode: Applied for the listed ids, Skipped for the rest
        applied = set((a.auto_applied or '').split(',')) - {''}
        for fp in a.feedback:
            for kind, x, _ in items_from_feedback(load(fp)):
                labels.append({'itemId': x['itemId'], 'status': 'Applied' if x['itemId'] in applied else 'Skipped'})
    for t in a.labels or []:
        k, v = t.split('=', 1); labels.append({'itemId': k, 'status': v})
    tpl = (pathlib.Path(__file__).parent / 'lucid-writeback.example.js').read_text()
    js = re.sub(r'const LABELS = \[.*?\];', 'const LABELS = ' + json.dumps(labels) + ';', tpl, count=1, flags=re.S)
    js = re.sub(r'const COLORS = \{.*?\};', 'const COLORS = ' + json.dumps(LABEL_COLORS) + ';', js, count=1, flags=re.S)
    print(js)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    s = sp.add_parser('mode'); s.add_argument('--project', required=True); s.set_defaults(f=cmd_mode)
    s = sp.add_parser('propose'); s.add_argument('--project', required=True); s.add_argument('--cycle', type=int, required=True)
    s.add_argument('--feedback', action='append', required=True); s.add_argument('--carry'); s.add_argument('--out', required=True)
    s.add_argument('--dashboard-copy'); s.set_defaults(f=cmd_propose)
    s = sp.add_parser('summary'); s.add_argument('--proposals', required=True); s.set_defaults(f=cmd_summary)
    s = sp.add_parser('decide'); s.add_argument('--proposals', required=True); s.add_argument('--dashboard-copy')
    s.add_argument('--by', default='John Dilworth'); s.add_argument('decisions', nargs='+'); s.set_defaults(f=cmd_decide)
    s = sp.add_parser('apply'); s.add_argument('--proposals', required=True); s.add_argument('--plan', required=True); s.set_defaults(f=cmd_apply)
    s = sp.add_parser('mark-applied'); s.add_argument('--proposals', required=True); s.add_argument('--dashboard-copy')
    s.add_argument('--commit', required=True); s.add_argument('ids', nargs='*'); s.set_defaults(f=cmd_mark_applied)
    s = sp.add_parser('carry'); s.add_argument('--proposals', required=True); s.add_argument('--out', required=True); s.set_defaults(f=cmd_carry)
    s = sp.add_parser('writeback-js'); s.add_argument('--proposals'); s.add_argument('--doc-id'); s.add_argument('--labels', nargs='*')
    s.add_argument('--feedback', action='append'); s.add_argument('--auto-applied'); s.set_defaults(f=cmd_writeback_js)
    a = ap.parse_args(); a.f(a)

if __name__ == '__main__':
    main()
