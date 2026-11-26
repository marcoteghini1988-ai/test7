// Decisione utente 25/11: salve vere 3/6/9, origini variabili e coreografie
// diverse. Una salva è un'azione: Difesa, copertura e bonus si risolvono una
// volta, poi il danno effettivo viene attribuito ai singoli proiettili.
// La somma resta ESATTAMENTE il danno della carta, incluse mitigazioni e cap.
const rows=[
 ['weapon-confirmed-metallic-maglio',[2,3,5,7],['rotating-hammers','rotating-hammers','rotating-hammers','rotating-hammers'],1400,130],
 ['weapon-confirmed-metallic-slitta',[1,1,1,1],['single-cannonball','single-cannonball','single-cannonball','single-cannonball'],1030,0],
 ['weapon-designed-metallic-recuperatore-termobalistico',[0,0,3,3],[null,null,'thermal-lob','thermal-lob'],1250,175],
 ['weapon-designed-metallic-ganasce-magnetiche',[0,1,1,1],[null,'opposed-jaws','whip-anchors','orbital-anchors'],1450,0],
 ['weapon-designed-metallic-collassatore-lega',[0,0,1,1],[null,null,'single-jaw-b','single-jaw-b'],1450,0],
 ['weapon-designed-metallic-frantumatore-induzione',[0,0,3,6],[null,null,'three-blade-sweep','six-blade-cyclone'],1000,125],
 ['weapon-designed-metallic-perforatore-cascata',[0,0,1,3],[null,null,'axial-drill','braided-drill'],1350,130],
 ['weapon-designed-metallic-artiglieria-schegge',[0,3,6,9],[null,'fan-three','rotating-six','shrapnel-storm'],1050,110],
 ['weapon-base-ionic-01',[1,1,1,1],Array(4).fill('ionic-comb'),770,0],
 ['weapon-base-ionic-02',[1,1,1,1],Array(4).fill('ionic-dart'),1130,0],
 ['weapon-base-ionic-03',[1,1,1,1],Array(4).fill('ionic-whip'),930,0],
 ['weapon-base-ionic-04',[0,1,1,1],[null,'ionic-flash','ionic-flash','ionic-flash'],180,0]
];
const baseRarity=[0,0,2,1,2,2,2,1,0,0,0,1],suffix=['','-rarity-r','-rarity-e','-rarity-l'];
const definitions=rows.flatMap(([familyId,counts,styles,flightMs,gapMs],familyIndex)=>
 counts.flatMap((count,tier)=>tier<baseRarity[familyIndex]?[]:[{
  cardId:familyId+(tier===baseRarity[familyIndex]?'':suffix[tier]),familyId,tier,
  count,style:styles[tier],flightMs,gapMs,
  finisher:count>1&&['gravity-storm','double-orbit','orbital-trident','six-plus-lance','plasma-spiral','shrapnel-storm'].includes(styles[tier])
 }]));
export const APPROVED_WEAPON_SALVOS=Object.freeze(definitions.map(Object.freeze));
const byId=Object.freeze(Object.fromEntries(APPROVED_WEAPON_SALVOS.map(p=>[p.cardId,p])));
export const approvedWeaponSalvo=id=>byId[id]||null;
export function salvoProjectileDelay(plan,index){
 if(plan.style==='six-plus-lance')return index===6?850:index*100;
 if(['triple-battery','gravity-storm','shrapnel-storm'].includes(plan.style))
  return Math.floor(index/3)*310+(index%3)*65;
 return index*plan.gapMs;
}
export function salvoSpan(id){
 const p=approvedWeaponSalvo(id);return p?.count?salvoProjectileDelay(p,p.count-1):0;
}
export function allocateSalvoDamage(amount,plan){
 const total=Math.max(0,Math.round(Number(amount)||0)),count=Math.max(1,plan.count);
 const weights=Array.from({length:count},(_,i)=>plan.finisher&&i===count-1?plan.style==='six-plus-lance'?4:2:1);
 const sum=weights.reduce((n,x)=>n+x,0),exact=weights.map(w=>total*w/sum),out=exact.map(Math.floor);
 const order=exact.map((n,i)=>({i,f:n-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 const remainder=total-out.reduce((a,x)=>a+x,0);
 for(let n=0;n<remainder;n++)out[order[n].i]++;
 return out;
}
function packets(plan,hit){
 const damages=allocateSalvoDamage(hit.actualDamage,plan);
 return damages.map((actualDamage,index)=>({index,count:damages.length,actualDamage,
  targetKind:hit.targetKind,targetId:hit.targetId,delayMs:salvoProjectileDelay(plan,index),
  finisher:plan.finisher&&index===damages.length-1,
  visualScale:plan.count>1?plan.finisher&&index===plan.count-1?1:.66:1}));
}
// This is called by the combat event emitter, never invented by a renderer.
export function withWeaponSalvoEvent(kind,data){
 if(!['weapon-base-shot','weapon-designed-shot','weapon-provisional-shot'].includes(kind))return data;
 if(data.jawCombo)return data;
 let p=approvedWeaponSalvo(data.cardId);if(!p||p.count===0)return data;
 if(p.familyId.endsWith('recuperatore-termobalistico')){
  const base=data.baseNominalDamage??(p.tier===3?23:18),boosted=(data.impacts||[]).some(h=>h.nominalDamage>base);
  p={...p,count:boosted?6:3,finisher:false};
 }
 const salvo={count:p.count,style:p.style,defenseScope:'activation',damageScope:'total',version:1};
 if(data.impacts){
  const impacts=data.impacts.map(hit=>({...hit,projectileHits:packets(p,hit)}));
  return {...data,salvo,impacts,projectileCount:impacts.reduce((n,h)=>n+h.projectileHits.length,0)};
 }
 return {...data,salvo,projectileHits:packets(p,data),projectileCount:p.count};
}
export function salvoCardDescription(card,spec=card.effectSpec){
 const p=approvedWeaponSalvo(card.id);if(!p||p.count<=1)return null;
 const w=spec.weaponProfile||{},damage=spec.baseDamage??w.baseDamage??0;
 const base=`Salva di ${p.count} colpi · ${damage} HP totali`;
 if(p.style==='six-plus-lance')return `6 colpi rapidi + 1 lancia finale · ${damage} HP totali su un bersaglio. Difese e copertura verificano l'azione completa.`;
 if(p.style.includes('thermal')||p.style.includes('plasma'))return `3 granate base / 6 potenziate · ${damage} HP totali`+
  ` +${w.damageConversionPercent}% degli HP realmente persi dalla flotta dopo la posa (max +${w.maxExtraDamage} HP), per ${w.durationTurns} turni propri.`;
 if(p.style.includes('blade'))return base+'. Con 1 Energia Metallo supera una Difesa; con 2 ne smonta una. Senza Difese: +20% / +40% con 1 / almeno 2 Energie. Non consuma Energie e non cumula bonus e bypass.';
 if(p.style.includes('drill'))return base+` per ${w.durationTurns} turni. Il residuo passa al prossimo bersaglio pagando ${w.energyTransferCost} Energia Metallo per trasferimento.`;
 if(p.familyId.endsWith('artiglieria-schegge'))return base+` per ${w.durationTurns} turni propri; cambia bersaglio quando possibile.`;
 return base+' su un bersaglio. Difese e copertura verificano la salva completa.';
}
export function withApprovedWeaponSalvo(card){
 const p=approvedWeaponSalvo(card.id);if(!p)return Object.freeze(card);
 if(card.effectSpec.salvoCount===p.count&&card.effectSpec.salvoStyle===p.style)return card;
 const effectSpec=Object.freeze({...card.effectSpec,salvoCount:p.count,salvoStyle:p.style,
  salvoDamageScope:'total',salvoDefenseScope:'activation'});
 return Object.freeze({...card,effectSpec,effectProposed:salvoCardDescription(card,effectSpec)||card.effectProposed});
}
