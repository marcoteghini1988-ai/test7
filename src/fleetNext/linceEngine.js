// Eclissi Stellare — 10 carte esclusive Lince Solare (C01).
// Regole e stato indipendenti dal renderer: non usare bonus approssimativi.
export const LINCE_ACTIONS=Object.freeze({
 'nx-c01-01':'radent-thrusters',
 'nx-c01-02':'solar-bypass',
 'nx-c01-03':'tail-claw',
 'nx-c01-04':'false-trail',
 'ex-c01-01':'helios',
 'nx-c01-06':'marked-route',
 'nx-c01-07':'bow-blade',
 'nx-c01-08':'exposed-passage',
 'nx-c01-09':'armed-disengage',
 'nx-c01-10':'crimson-raid'
});
export const LINCE_MODULE_SLOTS=Object.freeze({
 'nx-c01-01':'utility',
 'nx-c01-07':'weapon'
});
export const LINCE_ATTACK_ACTIONS=Object.freeze([
 'solar-bypass','tail-claw','armed-disengage','crimson-raid'
]);
export const LINCE_BYPASS_ACTIONS=Object.freeze(['solar-bypass','crimson-raid']);

export const isLinceModule=id=>Object.hasOwn(LINCE_MODULE_SLOTS,id);
export const linceModuleSlot=id=>LINCE_MODULE_SLOTS[id]||null;
export const isLinceAction=id=>Object.hasOwn(LINCE_ACTIONS,id);
export function ensureLinceState(side){
 side.lince??={
  route:null,lastSuccessfulBypassPly:-999,radentUsedPly:-999,
  bladeUsedPly:-999,heliosUsedPly:-999
 };
 side.recalledModules??=[];
 side.recalledMachines??=[];
 return side.lince;
}
export function linceMarkedRouteReady(side,ply,partId){
 const route=side?.lince?.route;
 return !!route&&route.usePly===ply&&route.partId===partId;
}
export function lincePrecondition(def,side,battle=null){
 const action=LINCE_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0];
 if(!mother||mother.id!=='C01')return 'Carta utilizzabile soltanto con Lince Solare';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello di Lince Solare insufficiente';
 const alive=id=>mother.parts.some(p=>p.id===id&&!p.destroyed&&p.hp>0);
 if(isLinceModule(def.id)){
  const slot=linceModuleSlot(def.id);
  if(!alive(slot==='weapon'?'weapons':'generator'))return 'Sistema di alimentazione del modulo distrutto';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo identico già montato';
 }
 if(LINCE_ATTACK_ACTIONS.includes(action)&&!alive('weapons'))
  return 'Arsenale distrutto: comando offensivo indisponibile';
 if(action==='exposed-passage'){
  if(!alive('bridge'))return 'Passaggio scoperto richiede la Plancia operativa';
  if((side.lince?.lastSuccessfulBypassPly??-999)!==(battle?.ply??-100)-2)
   return 'Nel precedente tuo turno non hai eseguito un Aggiramento riuscito';
 }
 if(action==='crimson-raid'&&!['weapon','utility'].some(slot=>{
  const m=side.modules?.[slot];return m&&m.hp>0&&!m.destroyed;
 }))return 'Serve un modulo montato e operativo da sacrificare';
 return '';
}
export function recallLinceModule(side,slot){
 const module=side?.modules?.[slot];
 if(!module||module.hp<=0||module.destroyed)return null;
 ensureLinceState(side);
 side.modules[slot]=null;
 side.recalledModules.push({...module});
 side.hand.push(module.cardId);
 return module;
}
export function recallLinceMachine(side,unit){
 if(!unit||unit.destroyed||unit.hp<=0||!side.machines?.some(m=>m.id===unit.id))return null;
 if(!unit.sourceCardId)return null;
 ensureLinceState(side);
 side.machines=side.machines.filter(m=>m.id!==unit.id);
 side.recalledMachines.push({...unit});
 side.hand.push(unit.sourceCardId);
 return unit;
}
export function recoveredMachineForDeploy(side,sourceCardId){
 const index=(side.recalledMachines||[]).findIndex(m=>m.sourceCardId===sourceCardId);
 return index<0?null:side.recalledMachines.splice(index,1)[0];
}
export function recoveredModuleForMount(side,sourceCardId){
 const index=(side.recalledModules||[]).findIndex(m=>m.cardId===sourceCardId);
 return index<0?null:side.recalledModules.splice(index,1)[0];
}
