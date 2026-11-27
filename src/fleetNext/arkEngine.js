// Arca Astrale (L04) — 10 esclusive native e protezione delle fusioni.
 // Le due fusioni ufficiali usano supporti L5 indipendenti, senza riserve.
import {SUPPORT_MAX_LEVEL} from './supportProgression.js';
export const ARK_ACTIONS=Object.freeze({
 'nx-l04-01':'stellar-archive',
 'nx-l04-02':'conserving-ray',
 'nx-l04-03':'reserve-custody',
 'ex-l04-01':'astral-keeper',
 'nx-l04-05':'ark-fusion',
 'nx-l04-06':'repair-chorus',
 'nx-l04-07':'star-launcher',
 'nx-l04-08':'protected-entry',
 'nx-l04-09':'fleet-resonance',
 'nx-l04-10':'astral-convergence'
});
export const ARK_MODULE_SLOTS=Object.freeze({
 'nx-l04-01':'utility','nx-l04-07':'weapon'
});
export const ARK_ATTACK_ACTIONS=Object.freeze([
 'conserving-ray','astral-convergence'
]);
export const isArkModule=id=>Object.hasOwn(ARK_MODULE_SLOTS,id);
export const arkModuleSlot=id=>ARK_MODULE_SLOTS[id]||null;
export const arkAlive=u=>!!u&&u.hp>0&&!u.destroyed;
const vital=(side,id)=>!!side?.ships?.[0]?.parts?.some(p=>p.id===id&&arkAlive(p));
export const arkEscortReady=(side,e,ply=0)=>arkAlive(e)&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.nebulaHiddenUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>vital(side,id));
export const arkEscorts=(side,ply=0)=>
 (side?.escorts||[]).filter(e=>arkEscortReady(side,e,ply));
export const arkFusedEscorts=(side,ply=0)=>
 arkEscorts(side,ply).filter(e=>e.fused);
export const arkUnfusedEscorts=(side,ply=0)=>
 arkEscorts(side,ply).filter(e=>!e.fused);
export const arkEnemyUnits=(side)=>[
 ...(side?.escorts||[]).filter(arkAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(arkAlive).map(unit=>({kind:'machine',unit}))
];
export function ensureArkState(side){
 side.ark??={archiveUsedPly:-999,custodianUsedPly:-999,
  repairedPly:-999,qualifiedRepairPly:-999,
  launcherUsedPly:-999,recoveredModules:[]};
 return side.ark;
}
export const arkModuleActive=(side,id,ply=0)=>{
 const slot=ARK_MODULE_SLOTS[id],m=slot&&side?.modules?.[slot];
 return side?.ships?.[0]?.id==='L04'&&m?.cardId===id&&
  arkAlive(m)&&(m.disabledUntilPly||0)<=ply&&vital(side,slot==='weapon'?'weapons':'generator');
};
export const arkModulesInDiscard=(side)=>
 (side?.discard||[]).filter(id=>id==='nx-l04-01'||id==='nx-l04-07');
export const arkDamagedEscorts=side=>(side?.escorts||[]).filter(e=>arkAlive(e)&&e.hp<e.maxHp);
export function arkPrecondition(def,side,battle=null){
 const action=ARK_ACTIONS[def?.id];if(!action)return '';
 if(side?.ships?.[0]?.id!=='L04')return 'Esclusiva utilizzabile solo con Arca Astrale';
 const ply=battle?.ply??0,level=side.ships[0].level||1;
 if(level<(def.minShipLevelDraft||1))return 'Livello Arca Astrale insufficiente';
 const escorts=arkEscorts(side,ply);
 if(isArkModule(def.id)){
  const slot=arkModuleSlot(def.id);
  if(!vital(side,slot==='weapon'?'weapons':'generator'))
   return 'Sistema di alimentazione del modulo distrutto';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo Arca già montato';
 }
 if(ARK_ATTACK_ACTIONS.includes(action)&&!vital(side,'weapons'))
  return 'Arsenale distrutto: attacco Arca indisponibile';
 if(action==='reserve-custody'&&(!vital(side,'command')||!arkUnfusedEscorts(side,ply).length))
  return 'Custodia richiede Centralina e supporto non fuso operativo';
 if(action==='ark-fusion'){
  if(!vital(side,'command'))return 'La Fusione richiede Centralina operativa';
  const stage=side.fusionsUsed||0;
  if(stage>1||stage>=(side.fusionLimit||0))
   return 'Due fusioni massime già utilizzate';
  if(stage===0&&arkUnfusedEscorts(side,ply).length<2)
   return 'Prima Fusione richiede due supporti originali operativi';
  if(stage===1&&(
   !arkUnfusedEscorts(side,ply).some(e=>e.sourceIndices?.includes(2))||
   !(side.reserveEscorts||[]).some(e=>e.sourceIndices?.includes(3))))
   return 'Seconda Fusione richiede il terzo schierato e il quarto sbloccato in riserva';
 }
 if(action==='repair-chorus'&&!arkDamagedEscorts(side,ply).length)
  return 'Coro richiede almeno un supporto operativo danneggiato';
 if(action==='protected-entry'){
  if(!vital(side,'command'))return 'Ingresso protetto richiede Centralina';
  if(side.independentSupportRoster){
   const canFuse=(side.fusionsUsed||0)<(side.fusionLimit||0)&&
    arkUnfusedEscorts(side,ply).some(e=>e.supportLevel>=SUPPORT_MAX_LEVEL);
   if(!canFuse)return 'Ingresso protetto richiede un supporto L5 non ancora fuso';
  }else if((side.reserveEscorts||[]).length<1&&
   !(side.escorts||[]).some(e=>e.sourceIndices?.includes(2)&&e.deployedAtPly===ply))
   return 'Ingresso protetto richiede il terzo supporto sbloccato';
 }
 if(action==='fleet-resonance'&&(!vital(side,'command')||
  !arkFusedEscorts(side,ply).length||!arkUnfusedEscorts(side,ply).length))
  return 'Risonanza richiede Fusione e supporto non fuso operativi';
 if(action==='astral-convergence'&&(!vital(side,'command')||
  arkFusedEscorts(side,ply).length<2))
  return 'Convergenza richiede due Fusioni operative e Centralina';
 if(action==='conserving-ray'||action==='astral-convergence'){
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&arkEnemyUnits(enemy).length<
   (action==='astral-convergence'?2:1))
   return 'Attacco Arca richiede bersagli nemici distinti e vivi';
 }
 return '';
}
export function arkChoiceReason(side,enemy,chosen=[],order={},ply=0){
 const actions=chosen.filter(c=>c?.effectSpec?.type==='ark').map(c=>c.effectSpec.action);
 const fusionCount=actions.filter(a=>a==='ark-fusion').length+
  chosen.filter(c=>c?.effectSpec?.type==='fusion'&&c.shipId==='L04').length;
 if(fusionCount>0&&fusionCount>Math.min(2,side.fusionLimit||0)-(side.fusionsUsed||0))
  return 'Non ci sono abbastanza Fusioni dell’Arca ancora disponibili';
 if(fusionCount===2&&(!(side.reserveEscorts||[]).some(e=>e.sourceIndices?.includes(2))||
  !(side.reserveEscorts||[]).some(e=>e.sourceIndices?.includes(3))))
  return 'Due Fusioni nello stesso turno richiedono entrambe le riserve sbloccate';
 if(actions.filter(a=>ARK_ATTACK_ACTIONS.includes(a)).length>1)
  return 'Un solo attacco Arca Astrale per turno';
 const escorts=arkEscorts(side,ply),damaged=arkDamagedEscorts(side,ply);
 const living=(side.escorts||[]).filter(arkAlive);
 const target=arkEnemyUnits(enemy).find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId);
 if(actions.some(a=>ARK_ATTACK_ACTIONS.includes(a))&&
  (!target||!['escort','machine'].includes(target.kind)||order.pass))
  return 'Comando Arca: scegli una macchina o un supporto avversario';
 if(actions.includes('astral-convergence')){
  const second=arkEnemyUnits(enemy).find(t=>t.kind===order.arkSecondKind&&
   t.unit.id===order.arkSecondId);
  if(order.arkSecondId&&(!second||second.unit.id===target?.unit.id))
   return 'Convergenza: secondo bersaglio assente o uguale al primo';
  if(!arkEnemyUnits(enemy).some(t=>t.unit.id!==target?.unit.id))
   return 'Convergenza: servono due unità nemiche diverse';
 }
 if(actions.includes('conserving-ray')&&order.arkRayEscortId&&
  !living.some(e=>e.id===order.arkRayEscortId))
  return 'Raggio: supporto da riparare non operativo';
 if(actions.includes('reserve-custody')&&order.arkCustodyEscortId&&
  !arkUnfusedEscorts(side,ply).some(e=>e.id===order.arkCustodyEscortId))
  return 'Custodia: seleziona supporto non fuso in campo';
 if(actions.includes('repair-chorus')){
  if(order.arkChorusFirstId&&!damaged.some(e=>e.id===order.arkChorusFirstId))
   return 'Coro: primo supporto non danneggiato o non operativo';
  if(order.arkChorusSecondId&&!damaged.some(e=>e.id===order.arkChorusSecondId))
   return 'Coro: secondo supporto non danneggiato o non operativo';
  if(!['focus','split',undefined,null,''].includes(order.arkChorusMode))
   return 'Coro: distribuzione non valida';
  if(order.arkChorusMode==='split'){
   const first=damaged.find(e=>e.id===order.arkChorusFirstId)||damaged[0];
   if(!damaged.some(e=>e.id!==first?.id))
    return 'Coro diviso richiede due supporti feriti distinti';
   if(order.arkChorusSecondId===first?.id)
    return 'Coro non può dividere sulla stessa unità';
  }
 }
 if(actions.includes('fleet-resonance')){
  if(order.arkFusedId&&!arkFusedEscorts(side,ply).some(e=>e.id===order.arkFusedId))
   return 'Risonanza: Fusione dichiarata assente';
  if(order.arkResonanceEscortId&&!arkUnfusedEscorts(side,ply).some(e=>e.id===order.arkResonanceEscortId))
   return 'Risonanza: supporto non fuso assente';
 }
 if(order.arkArchive){
  if(!arkModuleActive(side,'nx-l04-01',ply))
   return 'Archivio non montato o non operativo';
  if((side.ark?.archiveUsedPly??-999)===ply)
   return 'Archivio già attivato nel turno';
  const spent=new Map();
  for(const c of chosen)spent.set(c.id,(spent.get(c.id)||0)+1);
  const handLeft=(side.hand||[]).filter(id=>{
   const n=spent.get(id)||0;if(n){spent.set(id,n-1);return false;}return true;
  });
  if(!handLeft.length)return 'Archivio richiede una carta vera non giocata da scartare';
  if(order.arkArchiveDiscardId&&!handLeft.includes(order.arkArchiveDiscardId))
   return 'Archivio: carta da scartare non in mano';
  if(!arkModulesInDiscard(side).length)
   return 'Archivio: nessun modulo Arca negli scarti';
  if(order.arkRecoverModuleId&&!arkModulesInDiscard(side).includes(order.arkRecoverModuleId))
   return 'Archivio: modulo scelto assente dagli scarti';
 }
 if(order.arkArchive&&order.arkCustodianSwap){
  const remaining=(side.hand||[]).length-chosen.length;
  if(remaining<2)return 'Archivio e Custode richiedono due carte distinte da spendere';
 }
 if(order.arkCustodianSwap){
  const active=(side.commander?.id==='ex-l04-01'&&
   side.commander.untilPly>ply)||actions.includes('astral-keeper');
  if(!active)return 'Vegliatore delle Rotte Celesti non attivo';
  const consumed=new Map();
  for(const c of chosen)consumed.set(c.id,(consumed.get(c.id)||0)+1);
  const left=(side.hand||[]).filter(id=>{
   const n=consumed.get(id)||0;if(n){consumed.set(id,n-1);return false;}return true;
  });
  if(!left.length)return 'Custode: serve una carta rimasta in mano';
  if(order.arkCustodianBottomId&&!left.includes(order.arkCustodianBottomId))
   return 'Custode: carta scelta già giocata';
 }
 return '';
}
