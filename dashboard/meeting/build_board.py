import json,sys
def js(title, rows, content, cards):
    return r"""
const b=skills.basecanvasediting, T=skills.text;
const Y=6189.020625, H=3907.134678761109, FONT='Fraunces 72pt';
const frames=[["1.0",92,"#e65100","#ffffff",TITLE,85,"#ffffff"],["From last time",2292,"#eeeeee","#eeeeee","From last time",60,"#000000"],["How ae we doing?",4492,"#eeeeee","#eeeeee","How are we doing?",60,"#000000"],["1.3",6692,"#eeeeee","#eeeeee","Areas of focus",60,"#000000"],["1.4",8892,"#eeeeee","#eeeeee","Quick Hits",60,"#000000"],["1.5",11092,"#eeeeee","#eeeeee","Discussion",60,"#000000"],["1.6",13292,"#eeeeee","#eeeeee","Action Items",60,"#000000"]];
const st=(o)=>{try{b.editBlockStyle(o);}catch(e){}};
const out={frames:{},stickies:[],cards:[]};
for(const [fl,x,fill,tc,head,fs,hc] of frames){
  const f=await b.createBlock({className:'SparkFrameBlock',x,y:Y,width:2000,height:H,label:fl});
  st({itemId:f.id,fillColor:fill,lineColor:'#000000',lineWidth:0});
  await T.setItemTextStyle({itemId:f.id,styles:[{style:'textColor',value:tc}]});
  const t=await b.createBlock({className:'AutoGrowTextBlock',x:x+200,y:Y+200,width:1600,label:head});
  await T.setItemTextStyle({itemId:t.id,styles:[{style:'fontSize',value:String(fs)},{style:'fontFamily',value:FONT}]});
  await T.setPartialTextStyle({itemId:t.id,textAreaName:'Text',substring:head,styles:[{style:'textColor',value:hc}]});
  await T.setTextAlignment({itemId:t.id,textAlign:'left',textVAlign:'middle'});
  st({itemId:t.id,lineColor:'#3a414a',lineWidth:2});
  b.moveBlock({itemId:t.id,x:x+200,y:Y+200});
  out.frames[head===TITLE?'header':head]={id:f.id,x,headingId:t.id};
}
const hx=4692;
for(const [lab,y,h] of [["Good",6687.1418469453365,1480.6536718447505],["Bad/Uncertain",8382.312278438596,1494.4348795799106]]){
  const s=await b.createBlock({className:'SparkFrameBlock',x:hx,y,width:1654.1740571265427,height:h,label:lab});
  await T.setItemTextStyle({itemId:s.id,styles:[{style:'textColor',value:'#ffffff'},{style:'fontSize',value:'14'}]});
  out.frames[lab]={id:s.id,x:hx,y};
}
const m=await skills.dynamicmatrix.create({location:{x:6876.119708695854,y:6740.359797438699},rowLabels:ROWS,columnLabels:['','','']});
for(const r of m.rows){try{await skills.dynamicmatrix.setRowStyle(m.generatorId,r.id,{headerFillColor:'#ffffff'});}catch(e){}}
out.matrix={id:m.generatorId,rows:m.rows.map(r=>[r.id,r.label]),cols:m.columns.map(c=>c.id)};
async function sticky(text,x,y,w=360){const s=await b.createBlock({className:'StickiesStickyNoteBlock',x,y,width:w,height:w,label:text});
  await T.setTextAlignment({itemId:s.id,textAlign:'left',textVAlign:'top'}); return s.id;}
const C=CONTENT;
for(const [where,items] of Object.entries(C)){
  if(where==='focus'){ for(const [ri,text] of items){const id=await sticky(text,6000,12000,200); await skills.dynamicmatrix.moveItemToCell(m.generatorId,id,{rowId:m.rows[ri].id,columnId:m.columns[0].id}); out.stickies.push({frame:'Areas of focus',row:m.rows[ri].label,id,text});} continue;}
  let x0,y0; if(where==='Good'||where==='Bad/Uncertain'){x0=hx+150;y0=out.frames[where].y+150;} else {x0=out.frames[where].x+200;y0=Y+700;}
  let i=0; for(const text of items){const per=(where==='Good'||where==='Bad/Uncertain')?3:4; const id=await sticky(text,x0+(i%per)*420,y0+Math.floor(i/per)*420); out.stickies.push({frame:where,id,text}); i++;}
}
const K=skills.lucidcards; const CARDS=CARDLIST;
if(CARDS.length){
  let def=(await K.listFieldDefinitions()).find(d=>d.label==='Source Meeting');
  const fn=def?def.name:(await K.addFieldDefinition({label:'Source Meeting',type:'string'})).fieldName;
  let i=0; const fx=out.frames['From last time'].x+200;
  for(const c of CARDS){const spec={location:{x:fx,y:Y+700+i*200},width:1600,title:c.title,status:c.status,fields:{[fn]:c.source}}; if(c.assignee)spec.assignee=c.assignee; if(c.due)spec.endTime=c.due; if(c.description)spec.description=c.description;
    const card=await K.create(spec); out.cards.push({id:card.id,title:card.title,status:card.status,assignee:card.assignee}); i++;}
  out.cardsEndY=Y+700+i*200;
  for(const [j,text] of (OPENS).entries()){const id=await sticky(text,fx+j*420,Y+700+i*200+100); out.stickies.push({frame:'From last time',id,text});}
}
return out;
""".replace('TITLE',json.dumps(title)).replace('ROWS',json.dumps(rows)).replace('CONTENT',json.dumps(content['main'])).replace('CARDLIST',json.dumps(cards)).replace('OPENS',json.dumps(content.get('opens',[])))
