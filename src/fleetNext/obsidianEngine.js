// Titano Ossidiana (L03) — azioni ufficiali. Ogni preparazione occupa una
// sola zona e una carta, senza duplicare attacchi o bersagli dopo la posa.
export const OBSIDIAN_ACTIONS=Object.freeze({
 'nx-l03-01':'siege-anchors',
 'nx-l03-02':'black-howitzer',
 'nx-l03-03':'siege-fracture',
 'nx-l03-04':'obsidian-bulkhead',
 'ex-l03-01':'obsidian-magister',
 'nx-l03-06':'breaching-ramp',
 'nx-l03-07':'position-chains',
 'nx-l03-08':'obsidian-fusion',
 'nx-l03-09':'sealed-hatches',
 'nx-l03-10':'titan-verdict'
});
export const OBSIDIAN_MODULE_SLOTS=Object.freeze({
 'nx-l03-01':'utility','nx-l03-06':'weapon'
});
export const OBSIDIAN_ATTACK_ACTIONS=Object.freeze([
 'black-howitzer','siege-fracture','titan-verdict'
]);
export const OBSIDIAN_PREP_ACTIONS=Object.freeze(['black-howitzer','titan-verdict']);
export const isObsidianModule=id=>Object.hasOwn(OBSIDIAN_MODULE_SLOTS,id);
export const obsidianModuleSlot=id=>OBSIDIAN_MODULE_SLOTS[id]||null;
export const isObsidianPreparation=id=>
 OBSIDIAN_PREP_ACTIONS.includes(OBSIDIAN_ACTIONS[id]);
export const obsidianAlive=u=>!!u&&!u.destroyed&&u.hp>0;
const powered=(side,id)=>
 !!side?.ships?.[0]?.parts?.some(p=>p.id===id&&obsidianAlive(p));
export const obsidianReadyEscort=(side,e,ply=0)=>obsidianAlive(e)&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.nebulaHiddenUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>powered(side,id));
export const obsidianReadyEscorts=(side,ply=0)=>
 (side?.escorts||[]).filter(e=>obsidianReadyEscort(side,e,ply));
export const obsidianEnemyUnits=side=>[
 ...(side?.escorts||[]).filter(obsidianAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(obsidianAlive).map(unit=>({kind:'machine',unit}))
];
export function obsidianFusedEscort(side,ply=0){
 return obsidianReadyEscorts(side,ply).find(e=>e.fused&&
  e.obsidianBastion===true)||null;
}
export function ensureObsidianState(side){
 side.obsidian??={pending:null,serial:0,
  magisterSwap:false,magisterUsedPly:-999,
  rampUsedPly:-999,lastFracturePly:-999,
  lastBastionGuardPly:-999};
 return side.obsidian;
}
export function obsidianModuleActive(side,id,ply=0){
 const slot=OBSIDIAN_MODULE_SLOTS[id],m=slot&&side?.modules?.[slot];
 return side?.ships?.[0]?.id==='L03'&&m?.cardId===id&&
  obsidianAlive(m)&&(m.disabledUntilPly||0)<=ply&&
  powered(side,slot==='weapon'?'weapons':'generator');
}
export const obsidianPending=(side)=>side?.obsidian?.pending||null;
// Paratia: esattamente il secondo colpo verso lo stesso vitale e nello stesso ply.
export function obsidianBulkheadTryHit(defense,ply,partId){
 if(!defense||defense.obsidianPartId!==partId||defense.untilPly<=ply)return false;
 if(defense.obsidianSeenPly!==ply){defense.obsidianSeenPly=ply;return false;}
 if(defense.obsidianBlockedPly===ply)return false;
 defense.obsidianBlockedPly=ply;
 return true;
}
export function obsidianSealed(side,ply=0){
 return side?.ships?.[0]?.id==='L03'&&
  !!side.defenses?.some(d=>d.id==='nx-l03-09'&&!d.hidden&&d.untilPly>ply);
}
export function obsidianPrecondition(def,side,battle=null){
 const action=OBSIDIAN_ACTIONS[def?.id];if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='L03')return 'Carta esclusiva del Titano Ossidiana';
 if((mother.level||1)<(def.minShipLevelDraft||1))
  return 'Livello Titano Ossidiana insufficiente';
 const escorts=obsidianReadyEscorts(side,ply);
 if(isObsidianModule(def.id)){
  const slot=obsidianModuleSlot(def.id);
  if(!powered(side,slot==='weapon'?'weapons':'generator'))
   return 'Sistema di alimentazione del modulo distrutto';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo Ossidiana già montato';
 }
 if(OBSIDIAN_ATTACK_ACTIONS.includes(action)&&!powered(side,'weapons'))
  return 'Arsenale distrutto: comando Ossidiana non disponibile';
 if(action==='obsidian-bulkhead'&&!mother.parts.some(obsidianAlive))
  return 'Paratia richiede un componente vitale operativo';
 if(OBSIDIAN_PREP_ACTIONS.includes(action)){
  if(side.obsidian?.pending)return 'Una preparazione Ossidiana è già in corso';
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(action==='black-howitzer'&&enemy&&
   !(enemy.machines||[]).some(obsidianAlive))
   return 'Tiro d’Assedio Ossidiano richiede una macchina nemica viva';
  if(action==='titan-verdict'&&enemy&&!obsidianEnemyUnits(enemy).length)
   return 'Sentenza richiede una unità nemica viva';
 }
 if(action==='siege-fracture'){
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&!obsidianEnemyUnits(enemy).length)
   return 'Frattura richiede una unità nemica viva';
 }
 if(action==='position-chains'){
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&!(enemy.machines||[]).some(obsidianAlive))
   return 'Catene di posizione richiede una macchina nemica da scegliere';
 }
 if(action==='obsidian-fusion'){
  if(!powered(side,'command'))return 'Fusione Ossidiana richiede la Centralina';
  if(!side.fusionLimit||(side.fusionsUsed||0)>=side.fusionLimit)
   return 'Fusione Ossidiana già consumata o non sbloccata';
  if(escorts.length!==2||escorts.some(e=>e.fused))
   return 'Fusione richiede entrambi i supporti originali operativi';
 }
 if(action==='titan-verdict'){
  if(!powered(side,'command'))return 'Sentenza del Titano richiede la Centralina';
  if(!obsidianFusedEscort(side,ply))return 'Serve il Bastione d’Assedio fuso e operativo';
 }
 return '';
}
export function obsidianChoiceReason(side,enemy,chosen=[],order={},ply=0){
 const actions=chosen.filter(c=>c?.effectSpec?.type==='obsidian')
  .map(c=>c.effectSpec.action);
 if(actions.filter(x=>OBSIDIAN_ATTACK_ACTIONS.includes(x)).length>1)
  return 'Un solo attacco Ossidiana per turno';
 if(actions.includes('obsidian-fusion')&&
  (chosen.some(c=>c.effectSpec.type==='fusion')||
   chosen.some(c=>c.effectSpec.type==='obsidian'&&
    ['titan-verdict','siege-fracture'].includes(c.effectSpec.action))))
  return 'Una sola Fusione e nessun attacco dai materiali nello stesso turno';
 const units=obsidianEnemyUnits(enemy);
 const primary=units.find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId);
 if(actions.includes('black-howitzer')){
  if(order.pass)return 'Tiro d’Assedio Ossidiano non può essere passato';
  if(order.targetKind!=='machine'||!primary)
   return 'Tiro d’Assedio Ossidiano richiede una macchina nemica dichiarata';
 }
 if(actions.includes('titan-verdict')||actions.includes('siege-fracture')){
  if(order.pass)return 'Attacco Ossidiana non può essere passato';
  if(!primary)return 'Attacco Ossidiana richiede un supporto o una macchina avversari';
 }
 if(actions.includes('obsidian-bulkhead')&&order.obsidianPartId&&
  !side.ships[0].parts.some(p=>p.id===order.obsidianPartId&&obsidianAlive(p)))
  return 'Paratia Ossidiana: componente scelto non operativo';
 if(actions.includes('position-chains')&&order.obsidianChainMachineId&&
  !enemy.machines?.some(m=>m.id===order.obsidianChainMachineId&&obsidianAlive(m)))
  return 'Catene: macchina nemica dichiarata non disponibile';
 if(order.obsidianGuard){
  if(!obsidianFusedEscort(side,ply))return 'Serve Bastione d’Assedio fuso e operativo';
  if((side.obsidian?.lastBastionGuardPly??-999)===ply)
   return 'Bastione già preparato per questo turno';
  if(actions.includes('obsidian-fusion'))
   return 'La difesa del Bastione può essere scelta dal prossimo tuo turno';
 }
 return '';
}
