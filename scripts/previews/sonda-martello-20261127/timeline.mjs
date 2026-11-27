// Un colpo visivo per ogni impatto realmente emesso dal motore.
const hash=s=>[...s].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17);
export function reviewTimeline(sequence){
 const hits=[];let start=160;
 for(const [fi,f]of sequence.frames.entries()){
  if(f.disabledBefore)continue;
  const flight=f.kind==='probe'?1080:1220;
  for(const [i,impact]of f.event.impacts.entries()){
   const launch=start+i*1420;
   hits.push({kind:f.kind,cardId:f.cardId,who:f.who,rarity:f.rarity,frameIndex:fi,index:i,
    bonus:f.kind==='hammer'&&i===1,launchAt:launch,impactAt:launch+flight,flightMs:flight,
    originX:65+hash(f.cardId+':'+i+':'+sequence.mode+':'+f.who)%320,originY:f.who==='A'?830:-30,
    targetId:impact.targetId,targetKind:impact.targetKind,actualDamage:impact.actualDamage,
    nominalDamage:impact.nominalDamage,blocked:!!impact.defenseBlocked,destroyed:!!impact.destroyed});
  }
  start=Math.max(start+1800,(hits.at(-1)?.impactAt||start)+850);
 }
 const mark=hits.find(h=>h.kind==='probe'&&h.actualDamage>0&&!h.destroyed);
 const hammer=hits.find(h=>h.kind==='hammer'),bonus=hits.find(h=>h.bonus);
 return {hits,mark:mark?{targetId:mark.targetId,targetKind:mark.targetKind,at:mark.impactAt+35,
  until:bonus?bonus.impactAt:hammer?hammer.impactAt:6600}:null,total:Math.max(6600,(hits.at(-1)?.impactAt||0)+1400)};
}
