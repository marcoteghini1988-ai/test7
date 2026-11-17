// Manta Ionica R02 — riserva energetica limitata, difese e scelte non automatiche.
export const MANTA_ACTIONS=Object.freeze({
 'nx-r02-01':'ion-capacitor',
 'nx-r02-02':'arc-discharge',
 'nx-r02-03':'absorption-screen',
 'nx-r02-04':'ion-ground',
 'ex-r02-01':'manta-navigator',
 'nx-r02-06':'reverse-polarity',
 'nx-r02-07':'ion-fork',
 'nx-r02-08':'manta-field',
 'nx-r02-09':'total-discharge',
 'nx-r02-10':'dielectric-reserve'
});
export const MANTA_MODULE_SLOTS=Object.freeze({
 'nx-r02-01':'utility','nx-r02-07':'weapon'
});
export const MANTA_ATTACK_ACTIONS=Object.freeze(['arc-discharge','total-discharge']);
export const isMantaModule=id=>Object.hasOwn(MANTA_MODULE_SLOTS,id);
export const mantaModuleSlot=id=>MANTA_MODULE_SLOTS[id]||null;
export const mantaAlive=u=>!!u&&u.hp>0&&!u.destroyed;
export const mantaVital=(side,id)=>!!side?.ships?.[0]?.parts?.some(p=>p.id===id&&mantaAlive(p));
export const mantaSupportReady=(side,e,ply=0)=>mantaAlive(e)&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>mantaVital(side,id));
export const mantaActiveSupports=(side,ply=0)=>
 (side?.escorts||[]).filter(e=>mantaSupportReady(side,e,ply));
export const mantaEnemyUnits=side=>[
 ...(side?.escorts||[]).filter(mantaAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(mantaAlive).map(unit=>({kind:'machine',unit}))
];
export function ensureMantaState(side){
 side.manta??={energy:0,lastEnemyDamagePly:-999,navigatorUses:0,
  lastNavigatorPly:-999,lastForkPly:-999};
 return side.manta;
}
export const mantaCapacitorActive=(side,ply=0)=>{
 const m=side?.modules?.utility;
 return side?.ships?.[0]?.id==='R02'&&m?.cardId==='nx-r02-01'&&mantaAlive(m)&&
 (m.disabledUntilPly||0)<=ply&&mantaVital(side,'generator');
};
export const mantaForkActive=(side,ply=0)=>{
 const m=side?.modules?.weapon;
 return side?.ships?.[0]?.id==='R02'&&m?.cardId==='nx-r02-07'&&mantaAlive(m)&&
 (m.disabledUntilPly||0)<=ply&&mantaVital(side,'weapons');
};
export const mantaEnergy=side=>Math.max(0,Math.min(2,side?.manta?.energy||0));
export function gainMantaEnergy(side,ply,amount=1){
 if(!mantaCapacitorActive(side,ply))return 0;
 const state=ensureMantaState(side),before=mantaEnergy(side);
 state.energy=Math.min(2,before+Math.max(0,amount));
 return state.energy-before;
}
export function spendMantaEnergy(side,ply,amount=1){
 if(!mantaCapacitorActive(side,ply)||mantaEnergy(side)<amount)return false;
 ensureMantaState(side).energy-=amount;
 return true;
}
export const mantaVisibleProtections=(side,ply=0)=>
 (side?.protections||[]).filter(p=>p.remaining>0&&p.untilPly>ply&&
  (side.defenses||[]).some(d=>d.source===p.source&&!d.hidden&&
   (d.untilPly==null||d.untilPly>ply)));
export function mantaPrecondition(def,side,battle=null){
 const action=MANTA_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='R02')return 'Carta esclusiva della Manta Ionica';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello Manta insufficiente';
 if(isMantaModule(def.id)){
  const slot=mantaModuleSlot(def.id);
  if(!mantaVital(side,slot==='utility'?'generator':'weapons'))
   return 'Alimentazione del modulo non disponibile';
  if(side.modules?.[slot]?.cardId===def.id)
   return 'Modulo Manta già montato';
 }
 if(MANTA_ATTACK_ACTIONS.includes(action)&&!mantaVital(side,'weapons'))
  return 'Arsenale distrutto: nessun attacco ionico';
 const supports=mantaActiveSupports(side,ply);
 const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
 if(action==='arc-discharge'&&enemy&&!mantaEnemyUnits(enemy).length)
  return 'Arco di scarica richiede una unità avversaria';
 if(action==='absorption-screen'&&(!mantaVital(side,'command')||!supports.length))
  return 'Schermo richiede Centralina e un supporto operativo';
 if(action==='ion-ground'&&(!mantaCapacitorActive(side,ply)||mantaEnergy(side)<1))
  return 'Messa a terra richiede una energia nel Capacitore';
 if(action==='reverse-polarity'){
  if(!mantaVital(side,'command')||supports.length<2)
   return 'Polarità richiede Centralina e due supporti operativi';
  const liveSlots=new Set(supports.map(e=>e.slot));
  if(!mantaVisibleProtections(side,ply).some(p=>
   p.target==='escort'&&liveSlots.has(p.escortSlot)))
   return 'Nessuna protezione scoperta trasferibile tra supporti';
 }
 if(action==='manta-field'){
  const first=supports.find(e=>e.sourceIndices?.includes(0)&&!e.fused);
  if(!mantaVital(side,'command')||!first||(first.grade||1)<2)
   return 'Campo Manta richiede primo supporto di grado 2 e Centralina';
  if(!mantaCapacitorActive(side,ply)||mantaEnergy(side)<1)
   return 'Campo Manta richiede una energia disponibile';
 }
 if(action==='total-discharge'){
  if(!mantaCapacitorActive(side,ply)||mantaEnergy(side)<2)
   return 'Scarica totale richiede due energie nel Capacitore';
  if(enemy&&!mantaEnemyUnits(enemy).some(t=>t.kind==='machine'))
   return 'Scarica totale richiede una macchina avversaria';
 }
 if(action==='dielectric-reserve'){
  if(!mantaCapacitorActive(side,ply)||mantaEnergy(side)>=2)
   return 'Riserva dielettrica richiede Capacitore con spazio disponibile';
  if(!mantaVisibleProtections(side,ply).length)
   return 'Nessuna protezione scoperta con cariche da trasferire';
 }
 return '';
}
