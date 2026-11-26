// Metadati grafici: non spende risorse e non modifica il danno.
export function weaponEnergyContributions(side,element,{physicalCount=0,cost=0}={},lookup){
 const out=[];let left=cost;
 for(const [pileIndex,entry]of (side.energyPile||[]).entries()){
  const id=typeof entry==='string'?entry:entry?.id,spec=lookup(id)?.effectSpec;
  if(spec?.type!=='energy'||spec.elementId!==element)continue;
  const remaining=typeof entry==='string'?1:Math.max(0,Math.floor(Number(entry.remaining)||0));
  if(cost){if(!remaining||left<=0)continue;const consumed=Math.min(left,remaining);left-=consumed;
   out.push({cardId:id,pileIndex,beforeCharges:remaining,afterCharges:remaining-consumed,consumed,discarded:consumed===remaining});
  }else if(out.length<physicalCount)out.push({cardId:id,pileIndex,beforeCharges:remaining,afterCharges:remaining,consumed:0,discarded:false});
 }
 return out;
}
