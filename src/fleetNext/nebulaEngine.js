// Nefelarca (E01): dieci esclusive native; occultamento senza invulnerabilita,
// difese a raffica e Terreni rimossi senza cancellare lo scenario permanente.
export const NEBULA_ACTIONS=Object.freeze({
 'nx-e01-01':'mist-projector',
 'nx-e01-02':'mist-needle',
 'nx-e01-03':'cryogenic-veil',
 'nx-e01-04':'false-target',
 'ex-e01-01':'mist-archon',
 'nx-e01-06':'dissipation',
 'nx-e01-07':'polar-mist',
 'nx-e01-08':'wandering-mist',
 'nx-e01-09':'veiled-cannon',
 'nx-e01-10':'cryogenic-night'
});
export const NEBULA_MODULE_SLOTS=Object.freeze({
 'nx-e01-01':'utility','nx-e01-09':'weapon'
});
export const NEBULA_ATTACK_ACTIONS=Object.freeze(['mist-needle','polar-mist']);
export const isNebulaModule=id=>Object.hasOwn(NEBULA_MODULE_SLOTS,id);
export const nebulaModuleSlot=id=>NEBULA_MODULE_SLOTS[id]||null;
export const nebulaAlive=u=>!!u&&u.hp>0&&!u.destroyed;
export const nebulaHidden=(u,ply=0)=>nebulaAlive(u)&&(u.nebulaHiddenUntilPly||0)>ply;
export const nebulaProtectionForbidden=(u,ply=0)=>nebulaAlive(u)&&(u.nebulaNoProtectionUntilPly||0)>ply;
const vitalActive=(side,id)=>!!side?.ships?.[0]?.parts?.some(p=>p.id===id&&nebulaAlive(p));
export const nebulaSupportEnabled=(side,e,ply=0)=>nebulaAlive(e)&&
 !nebulaHidden(e,ply)&&(e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>vitalActive(side,id));
export const nebulaSupports=(side,ply=0)=>((side?.escorts||[]).filter(e=>
 nebulaAlive(e)&&(e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>vitalActive(side,id))));
export const nebulaHiddenSupport=(side,ply=0)=>(side?.escorts||[]).find(e=>nebulaHidden(e,ply))||null;
export const nebulaTargets=(side)=>[
 ...(side?.escorts||[]).filter(nebulaAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(nebulaAlive).map(unit=>({kind:'machine',unit}))
];
export const nebulaModuleActive=(side,id,ply=0)=>{
 const slot=NEBULA_MODULE_SLOTS[id],m=slot&&side?.modules?.[slot];
 return side?.ships?.[0]?.id==='E01'&&m?.cardId===id&&nebulaAlive(m)&&
 (m.disabledUntilPly||0)<=ply&&vitalActive(side,slot==='weapon'?'weapons':'generator');
};
export function ensureNebulaState(side){
 side.nebula??={lastHidePly:-999,lastTerrainTradePly:-999,firstAttackPly:-999};
 return side.nebula;
}
export const nebulaVisibleSupports=(side,ply=0)=>nebulaSupports(side,ply).filter(e=>!nebulaHidden(e,ply));
export function nebulaHideReason(side,ply=0,id=null){
 if(!nebulaModuleActive(side,'nx-e01-01',ply))return 'Proiettore di bruma non operativo';
 if((side?.nebula?.lastHidePly??-999)===ply)return 'Proiettore gia usato in questo turno';
 const hidden=nebulaHiddenSupport(side,ply);
 if(hidden&&(hidden.nebulaHiddenUntilPly||0)!==ply+1)
  return 'Un supporto e gia occultato';
 const choices=nebulaVisibleSupports(side,ply);
 if(!choices.length)return 'Nessun supporto operativo da occultare';
 if(id&&!choices.some(e=>e.id===id))return 'Supporto scelto non occultabile';
 return '';
}
export function nebulaPrecondition(def,side,battle=null){
 const action=NEBULA_ACTIONS[def?.id],ply=battle?.ply??0;
 if(!action)return '';
 if(side?.ships?.[0]?.id!=='E01')return 'Carta esclusiva della Nefelarca';
 if(side.ships[0].level<(def.minShipLevelDraft||1))return 'Livello Nefelarca insufficiente';
 if(isNebulaModule(def.id)){
  const slot=nebulaModuleSlot(def.id);
  if(!vitalActive(side,slot==='weapon'?'weapons':'generator'))
   return 'Modulo Nefelarca privo di alimentazione';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo Nefelarca gia montato';
 }
 if(NEBULA_ATTACK_ACTIONS.includes(action)&&!vitalActive(side,'weapons'))
  return 'Arsenale distrutto: comando Nefelarca bloccato';
 const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
 if(NEBULA_ATTACK_ACTIONS.includes(action)&&enemy&&!nebulaTargets(enemy).length)
  return 'Serve una macchina o un supporto avversario';
 if(action==='cryogenic-veil'&&!nebulaTargets(side).length)
  return 'Velo criogenico richiede una tua unita';
 if(action==='wandering-mist'){
  if(!vitalActive(side,'command'))return 'Bruma itinerante richiede Centralina operativa';
  const hidden=nebulaHiddenSupport(side,ply);
  const other=nebulaVisibleSupports(side,ply).filter(e=>e.id!==hidden?.id);
  if(!hidden||!other.length)return 'Bruma itinerante richiede un supporto occultato e un altro operativo';
 }
 if(action==='dissipation'){
  if(!battle?.terrain?.id)return 'Nessun Terreno attivo da dissipare';
  if(['boss','campaign'].includes(battle.terrain.source)&&!battle.terrain.underlying)
   return 'Terreno permanente della battaglia: non puo essere rimosso';
 }
 return '';
}
export function nebulaChoiceReason(side,enemy,chosen=[],order={},ply=0){
 const actions=chosen.filter(c=>c?.effectSpec?.type==='nebula').map(c=>c.effectSpec.action);
 if(order.nebulaHide&&actions.includes('wandering-mist'))
  return 'Non puoi usare Proiettore e Bruma itinerante nello stesso turno';
 if(order.nebulaHide){
  const reason=nebulaHideReason(side,ply,order.nebulaHideEscortId);
  if(reason)return reason;
 }
 if(actions.includes('cryogenic-veil')&&order.nebulaVeilTargetId&&
  !nebulaTargets(side).some(t=>t.kind===order.nebulaVeilTargetKind&&
   t.unit.id===order.nebulaVeilTargetId))
  return 'Velo criogenico: bersaglio alleato non valido';
 if(actions.includes('wandering-mist')&&order.nebulaSwapTargetId&&
  !nebulaVisibleSupports(side,ply).some(e=>e.id===order.nebulaSwapTargetId))
  return 'Bruma itinerante: nuovo supporto non valido';
 if(order.nebulaTerrainTrade){
  const active=side.commander?.id==='ex-e01-01'&&side.commander?.untilPly>ply;
  const played=actions.includes('mist-archon');
  const terrain=chosen.some(c=>c.kind==='terrain');
  if(!terrain||!(active||played))return 'Arconte: serve un Personaggio attivo e un Terreno giocato';
  const consumed=new Map();
  for(const c of chosen)consumed.set(c.id,(consumed.get(c.id)||0)+1);
  const left=(side.hand||[]).filter(id=>{
   const n=consumed.get(id)||0;
   if(n){consumed.set(id,n-1);return false;}
   return true;
  });
  if(order.nebulaTradeCardId&&!left.includes(order.nebulaTradeCardId))
   return 'Arconte: scegli una carta che rimanga in mano';
  if(!left.length)return 'Arconte: serve una carta rimasta in mano';
 }
 return '';
}
