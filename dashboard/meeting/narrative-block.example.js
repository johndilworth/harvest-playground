const b=skills.basecanvasediting, T=skills.text;
const HEAD="Last time, in brief (FAKE)";
const BODY="We spent most of the 10/13 sync on release cadence. The team agreed to move from biweekly to weekly releases starting next sprint, and to keep the old login page until the mobile app ships so nothing breaks in between.\n\nCI came up again: the flakiness is mostly the e2e tests, and bob picked that up. chen is drafting the mobile onboarding mockups, which ties into the login decision. Staging for the new API is live, and alice's vendor shortlist is still waiting on two quotes.\n\nThe mood was mixed. The Friday demo and the merged onboarding docs were real wins, but people flagged meeting overload and doubts about the Q4 timeline. Still open: who owns the analytics dashboard now that Dana has left, and who will update the release checklist for the weekly cadence.";
const t=await b.createBlock({className:'AutoGrowTextBlock',x:2492,y:8300,width:1600,label:HEAD+"\n\n"+BODY});
await T.setItemTextStyle({itemId:t.id,styles:[{style:'fontFamily',value:'Inter'},{style:'fontSize',value:'28'},{style:'textColor',value:'#1f2328'}]});
await T.setPartialTextStyle({itemId:t.id,textAreaName:'Text',substring:HEAD,styles:[{style:'fontFamily',value:'Fraunces 72pt'},{style:'fontSize',value:'44'}]});
await T.setTextAlignment({itemId:t.id,textAlign:'left',textVAlign:'top'});
b.moveBlock({itemId:t.id,x:2492,y:8300});
const [i]=await b.inspect([t.id]); return {id:t.id,bb:i.boundingBox,parent:i.parent};
