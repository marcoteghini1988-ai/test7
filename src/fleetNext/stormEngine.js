// Eclissi Stellare — Vortiluce (E02): attacchi a più unità reali.
// Le azioni non inventano bersagli, carte, munizioni né danni ai vitali.
export const STORM_ACTIONS=Object.freeze({
 'nx-e02-01':'chain-coil',
 'nx-e02-02':'comb-wave',
 'nx-e02-03':'rebound-lightning',
 'nx-e02-04':'storm-front',
 'ex-e02-01':'storm-captain',
 'nx-e02-06':'thunder-reprise',
 'nx-e02-07':'selective-discharge',
 'nx-e02-08':'lightning-net',
 'nx-e02-09':'storm-capacitor',
 'nx-e02-10':'storm-quadrant'
});
export const STORM_MODULE_SLOTS=Object.freeze({
 'nx-e02-01':'weapon','nx-e02-09':'utility'
});
export const STORM_ATTACK_ACTIONS=Object.freeze([
 'comb-wave','rebound-lightning','thunder-reprise','selective-discharge','storm-quadrant'
]);
export const isStormModule=id=>Object.hasOwn(STORM_MODULE_SLOTS,id);
export const stormModuleSlot=id=>STORM_MODULE_SLOTS[id]||null;
export const stormAlive=u=>!!u&&u.hp>0&&!u.destroyed;
export const stormAvailable=(u,ply=0)=>stormAlive(u)&&
 (u.disabledUntilPly||0)<=ply&&(u.jammedUntilPly||0)<=ply;
const partReady=(side,id)=>!!side?.ships?.[0]?.parts?.some(p=>p.id===id&&stormAlive(p));
export const stormSupports=(side,ply=0)=>(side?.escorts||[]).filter(e=>
 stormAvailable(e,ply)&&(e.nebulaHiddenUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>partReady(side,id)));
export const stormUnits=(side,ply=0)=>[
 ...stormSupports(side,ply).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(m=>stormAvailable(m,ply))
  .map(unit=>({kind:'machine',unit}))
];
export function ensureStormState(side){
 side.storm??={chainFiredPly:-999,charge:false,chargeStoredPly:-999,
  lastChargePly:-999,lastHitsPly:-999,lastHits:[],
  captainUsedPly:-999,hitIds:[],hitPly:-999};
 return side.storm;
}
export const stormModuleActive=(side,id,ply=0)=>{
 const slot=stormModuleSlot(id);
 const m=slot&&side?.modules?.[slot];
 return side?.ships?.[0]?.id==='E02'&&m?.cardId===id&&stormAvailable(m,ply)&&
 partReady(side,slot==='weapon'?'weapons':'generator');
};
export function stormPrecondition(def,side,battle=null){
 const action=STORM_ACTIONS[def?.id];if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='E02')return 'Carta esclusiva di Vortiluce';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello Vortiluce insufficiente';
 if(isStormModule(def.id)){
  const slot=stormModuleSlot(def.id);
  if(!partReady(side,slot==='weapon'?'weapons':'generator'))
   return 'Sistema che alimenta il modulo non operativo';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo Vortiluce già installato';
 }
 if(STORM_ATTACK_ACTIONS.includes(action)&&!partReady(side,'weapons'))
  return 'Arsenale distrutto: comando Vortiluce non disponibile';
 const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
 const enemies=enemy?stormUnits(enemy,ply):[];
 if(STORM_ATTACK_ACTIONS.includes(action)&&enemy&&!enemies.length)
  return 'Attacco Vortiluce: nessuna unità nemica operativa';
 if(['rebound-lightning','selective-discharge','storm-quadrant'].includes(action)&&enemy&&
  enemies.length<2)return 'Attacco Vortiluce richiede due unità nemiche diverse';
 if(action==='storm-front'&&(!partReady(side,'command')||
  !stormSupports(side,ply).length||
  !(side.machines||[]).some(m=>stormAvailable(m,ply))))
  return 'Fronte di Vortiluce richiede Centralina, supporto e macchina alleata operativi';
 if(action==='lightning-net'&&(!partReady(side,'command')||stormSupports(side,ply).length<2))
  return 'Rete parafulmine richiede Centralina e due supporti operativi';
 if(action==='storm-quadrant'&&(!partReady(side,'command')||stormSupports(side,ply).length<2))
  return 'Quadrante di Vortiluce richiede Centralina e due supporti operativi';
 return '';
}
export function stormChoiceReason(side,enemy,chosen=[],order={},ply=0){
 const actions=chosen.filter(c=>c?.effectSpec?.type==='storm').map(c=>c.effectSpec.action);
 const units=stormUnits(enemy,ply),own=stormSupports(side,ply);
 const primary=units.find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId)||
  units[0];
 if(actions.includes('storm-front')&&order.stormFrontEscortId&&
  !own.some(e=>e.id===order.stormFrontEscortId))
  return 'Fronte di Vortiluce: supporto scelto non operativo';
 if(actions.some(a=>['rebound-lightning','selective-discharge','storm-quadrant'].includes(a))){
  if(!primary)return 'Attacco Vortiluce: nessun bersaglio principale';
  const second=units.find(t=>t.kind===order.stormSecondKind&&
   t.unit.id===order.stormSecondId);
  if(order.stormSecondId&&(!second||second.unit.id===primary.unit.id))
   return 'Secondo bersaglio Vortiluce assente o uguale al primo';
  if(!units.some(t=>t.unit.id!==primary.unit.id))
   return 'Attacco Vortiluce: due bersagli diversi obbligatori';
 }
 if(order.stormChainTargetId&&stormModuleActive(side,'nx-e02-01',ply)){
  if(!units.some(t=>t.kind===order.stormChainTargetKind&&
   t.unit.id===order.stormChainTargetId&&t.unit.id!==primary?.unit.id))
   return 'Bobina a catena: secondo bersaglio non operativo o identico';
 }
 if(order.stormCaptainTradeId){
  const consumed=new Map();
  for(const c of chosen)consumed.set(c.id,(consumed.get(c.id)||0)+1);
  const left=(side.hand||[]).filter(id=>{
   const n=consumed.get(id)||0;
   if(n){consumed.set(id,n-1);return false;}return true;
  });
  if(!left.includes(order.stormCaptainTradeId))
   return 'Capitano: carta scelta non rimasta in mano';
 }
 return '';
}
