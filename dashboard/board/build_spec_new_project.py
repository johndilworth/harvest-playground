#!/usr/bin/env python3
"""Lucidchart New project flow board for a Harvest Dashboard cycle. Usage: python3 build_spec_new_project.py <cycle> <commit> > c<N>/lucid-spec-new-project.json"""
import json, sys, html
from PIL import Image
N, COMMIT = int(sys.argv[1]), sys.argv[2]
B="https://harvest-dashboard.netlify.app"; C=f"{B}/captures/harvest-dashboard/c{N}-new-project"
D=f"../public/captures/harvest-dashboard/c{N}-new-project"
e=lambda s: html.escape(s, quote=False)
steps=[
 ("01-home-new-button","/","Home — + New project","Starting point: the all-projects home page. The + New project button (outlined in red) opens the setup form.","Clicked: + New project"),
 ("02-new-empty","/new.html","New project form — empty","Blank setup form: project, prototype source, live site & Netlify, a plain-text box to describe the flows to capture, harvest schedule (manual / daily / weekly with day pickers), merge policy, reviewers.","Next: fill in the form"),
 ("03-form-filled","/new.html","Form filled with sample data","Sample project 'Recipe Planner' with weekly schedule (Mon/Wed 17:00 MT), two flows described in plain language, two reviewers.","Clicked next: Review & create…"),
 ("04-validation-errors","/new.html","Validation errors","Bad input flagged inline (duplicate slug, repo must be owner/name, invalid email).","Clicked: Review & create… (with bad input)"),
 ("05-confirm-modal","/new.html","Review & confirm modal","'Create Harvest project' modal summarises every setting; passphrase + type CREATE. Wrong passphrase entered.","Clicked next: Create project"),
 ("06-wrong-passphrase","/new.html","Wrong passphrase result","Create refused: 'Failed: Wrong passphrase.' Nothing created.","End of flow (no project was created)"),
]
FW,PAD,GAP,CAPG,CAPH=2240,400,480,360,260
hs=[Image.open(f"{D}/{s[0]}.png").size[1] for s in steps]
FH=PAD+max(hs)+CAPG+CAPH+PAD
W=len(steps)*FW+(len(steps)-1)*GAP
title=f"Harvest Dashboard:New project:C{N}"  # Lucid doc title convention [Project]:[flow]:C[n]
sh=[{"id":"doc-title","type":"text","boundingBox":{"x":0,"y":-900,"w":W,"h":240},"text":f"<p style='font-size:40pt;text-align:left'><b>{title}</b><br><span style='font-size:20pt'>6 screens, left → right · Desktop 1440 wide · commit {COMMIT[:7]} · <a href=\"{B}/new.html\">{B}/new.html</a> · harvested manually</span></p>"},
 {"id":"legend-box","type":"text","boundingBox":{"x":0,"y":-600,"w":2600,"h":440},"text":"<p style='font-size:22pt;text-align:left'><b>How to add anything</b><br>Put a sticky note INSIDE a grey frame and write what you want changed on that screen of the New project flow. Harvests of this project are manual; safe requests are applied, committed and deployed. Start with <b>Do:</b> / <b>Must do</b>, <b>Try:</b> or <b>Consider:</b> to set priority (the words win over the colour); otherwise the colour counts. Purple = feedback about this board.<br><b>Stickies show your name — stay signed in.</b></p>"}]
for i,(c,f,s,t) in enumerate([("red","#FF8A80","#C62828","<b>Red</b><br>Do / Must do"),("yellow","#FFE066","#9A7B00","<b>Yellow</b><br>Try"),("blue","#A3E4FF","#1565C0","<b>Blue</b><br>Consider"),("purple","#BA23F6","#7B1FA2","<b>Purple</b><br>Board feedback")]):
    st={"fill":{"type":"color","color":f},"stroke":{"color":s,"width":2,"style":"solid"}}
    if c=="purple": st["textColor"]="#FFFFFF"
    sh.append({"id":f"legend-{c}","type":"rectangle","boundingBox":{"x":2700+i*320,"y":-570,"w":260,"h":300},"style":st,"text":f"<p style='font-size:24pt;text-align:center'>{t}</p>"})
lines=[]
for i,((k,route,t,desc,click),h) in enumerate(zip(steps,hs)):
    x=i*(FW+GAP)
    sh.append({"id":f"frame-{k}","type":"sparkFrame","boundingBox":{"x":x,"y":0,"w":FW,"h":FH},"style":{"fill":{"type":"color","color":"#F2F3F5"},"stroke":{"color":"#F2F3F5","width":0,"style":"solid"}},"title":f"{k} · {route} · {t}","customData":[{"key":"stepKey","value":k},{"key":"route","value":route},{"key":"cycle","value":str(N)},{"key":"flow","value":"New project"}]})
    sh.append({"id":f"shot-{k}","type":"image","boundingBox":{"x":x+PAD,"y":PAD,"w":1440,"h":h},"image":{"type":"image","url":f"{C}/{k}.png"},"stroke":{"color":"#C9CED8","width":2,"style":"solid"},"actions":[{"type":"url","url":B+route,"newWindow":True}]})
    sh.append({"id":f"caption-{k}","type":"text","boundingBox":{"x":x+PAD,"y":PAD+h+CAPG,"w":1440,"h":CAPH},"text":f"<p style='font-size:22pt;text-align:left'><b>{k} · {e(t)}</b><br><span style='font-size:16pt'>{e(desc)}</span><br><span style='font-size:16pt'><b>{e(click)}</b></span></p>"})
    if i: lines.append({"id":f"arrow-{i}","lineType":"straight","endpoint1":{"type":"positionEndpoint","style":"none","position":{"x":x-GAP-PAD+60,"y":PAD+512}},"endpoint2":{"type":"positionEndpoint","style":"arrow","position":{"x":x+PAD-60,"y":PAD+512}},"stroke":{"color":"#5F6673","width":4,"style":"solid"}})
print(json.dumps({"version":1,"pages":[{"id":"new-project","title":f"Cycle {N} · New project","shapes":sh,"lines":lines}]}, ensure_ascii=False))
