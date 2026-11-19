// Due Carte Attacco a sacrificio, distinte dalle Armi temporanee.
// I costi si calcolano sugli HP ATTUALI dei supporti presenti nei due slot.
export const SIPHON_ATTACK_IDS=Object.freeze({
 epic:'atk-siphon-e',legendary:'atk-siphon-l'
});

export function siphonAttackDescription(spec){
 const effect=spec.distribution==='split'?
  'Distribuisce il danno totale in parti quasi uguali fra tutte le navi avversarie presenti, madre inclusa.':
  'Infligge l’intero danno generato a ciascuna nave avversaria presente, madre inclusa.';
 return 'Attacco immediato: sottrae il '+spec.sacrificePercent+
  '% degli HP attuali di ogni tuo supporto operativo (arrotondamento per eccesso, minimo 1 HP). '+
  'Serve almeno un supporto e nessuno può scendere sotto 1 HP. '+effect+
  ' Bersagli automatici. Occupa uno slot Attacco nel turno corrente, poi va negli scarti.';
}

function named(id,name,rarita,distribution){
 const effectSpec=Object.freeze({type:'siphonStrike',sacrificePercent:20,distribution});
 return Object.freeze({
  id,name,nome:name,kind:'attack',category:'Attacco',categoria:'Attacco',
  sottotipo:'Scarica a sacrificio',playable:true,nativeFace:true,
  rarita,rarityPending:false,acquisitionPending:true,
  effectSpec,effectProposed:siphonAttackDescription(effectSpec),
  visualBrief:'Scarica offensiva che converte gli HP dei propri supporti in colpi su tutta la flotta nemica. Illustrazione da approvare.'
 });
}
export const SIPHON_ATTACKS=Object.freeze([
 named(SIPHON_ATTACK_IDS.epic,'Scarica Sifone','Epica','split'),
 named(SIPHON_ATTACK_IDS.legendary,'Scarica Sifone Omega','Leggendaria','each')
]);
export const SIPHON_ATTACK_BY_ID=Object.freeze(
 Object.fromEntries(SIPHON_ATTACKS.map(def=>[def.id,def]))
);

const inField=unit=>unit&&Number.isFinite(unit.hp)&&unit.hp>0&&!unit.destroyed&&!unit.reserve&&
 Number.isInteger(unit.slot)&&unit.slot>=0&&unit.slot<2;

export function siphonSacrificePlan(side,percent=20){
 const donors=(side?.escorts||[]).filter(inField).sort((a,b)=>a.slot-b.slot);
 if(!donors.length)return {ok:false,reason:'Serve almeno un supporto operativo in campo'};
 const sacrifices=donors.map(unit=>({
  id:unit.id,slot:unit.slot,before:unit.hp,
  cost:Math.max(1,Math.ceil(unit.hp*percent/100))
 }));
 if(sacrifices.some(s=>s.before-s.cost<1))
  return {ok:false,reason:'Un supporto ha HP insufficienti: il sacrificio deve lasciargli almeno 1 HP'};
 return {ok:true,sacrifices,total:sacrifices.reduce((sum,s)=>sum+s.cost,0)};
}

export function siphonTargetPlan(enemy,total,distribution){
 const supports=(enemy?.escorts||[]).filter(inField).sort((a,b)=>a.slot-b.slot)
  .map(u=>({kind:'escort',id:u.id,slot:u.slot}));
 const mother=enemy?.ships?.[0];
 const targets=mother&&mother.hp>0?[...supports,{kind:'mother',id:mother.id,slot:null}]:supports;
 const count=targets.length;
 if(!count)return [];
 const damage=Math.max(0,Math.floor(total));
 const each=Math.floor(damage/count),remainder=damage%count;
 return targets.map((target,i)=>({...target,nominalDamage:distribution==='each'?
  damage:each+(i<remainder?1:0)}));
}
