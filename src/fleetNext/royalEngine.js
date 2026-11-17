// Eclissi Stellare — Eclisse Reale L01: 10 carte esclusive e Corona Unita.
// Tutti gli ordini richiedono risorse reali; nessun colpo o scudo implicito.
export const ROYAL_ACTIONS=Object.freeze({
 'nx-l01-01':'crown-relay',
 'nx-l01-02':'royal-rain',
 'nx-l01-03':'protective-crown',
 'nx-l01-04':'interdiction-decree',
 'ex-l01-01':'eclipse-sovereign',
 'nx-l01-06':'cross-order',
 'nx-l01-07':'regal-lance',
 'nx-l01-08':'royal-bastion',
 'nx-l01-09':'coordinated-judgment',
 'nx-l01-10':'crown-fusion'
});
export const ROYAL_MODULE_SLOTS=Object.freeze({
 'nx-l01-01':'utility','nx-l01-07':'weapon'
});
export const ROYAL_ATTACK_ACTIONS=Object.freeze(['royal-rain','coordinated-judgment']);
export const ROYAL_SUPPORT_ATTACKS=Object.freeze(['coordinated-judgment']);
export const isRoyalModule=id=>Object.hasOwn(ROYAL_MODULE_SLOTS,id);
export const royalModuleSlot=id=>ROYAL_MODULE_SLOTS[id]||null;
export const royalAlive=u=>!!u&&u.hp>0&&!u.destroyed;
export const royalPart=(side,id)=>
 !!side?.ships?.[0]?.parts?.some(p=>p.id===id&&royalAlive(p));
export const royalSupportReady=(side,e,ply=0)=>royalAlive(e)&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.nebulaHiddenUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(part=>royalPart(side,part));
export const royalSupports=(side,ply=0)=>
 (side?.escorts||[]).filter(e=>royalSupportReady(side,e,ply));
export const royalUnits=(side,ply=0)=>[
 ...(side?.escorts||[]).filter(royalAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(royalAlive).map(unit=>({kind:'machine',unit}))
];
export const royalCapableModule=(side,id,ply=0)=>{
 const slot=ROYAL_MODULE_SLOTS[id],m=slot&&side?.modules?.[slot];
 return side?.ships?.[0]?.id==='L01'&&m?.cardId===id&&royalAlive(m)&&
 (m.disabledUntilPly||0)<=ply&&royalPart(side,slot==='weapon'?'weapons':'generator');
};
export const royalVisibleProtections=(side,ply=0)=>(
 side?.protections||[]).filter(p=>p.remaining>0&&p.untilPly>ply&&
 p.target==='escort'&&royalSupports(side,ply).some(e=>e.slot===p.escortSlot)&&
 side.defenses?.some(d=>d.source===p.source&&!d.hidden&&d.untilPly>ply));
export function ensureRoyalState(side){
 side.royal??={lastRelayPly:-999,lastSovereignPly:-999,
  lastCrownGuardPly:-999,lastLancePly:-999};
 return side.royal;
}
const POWER_CARDS=new Set(['royal-rain','coordinated-judgment']);
export function royalPrecondition(def,side,battle=null){
 const action=ROYAL_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='L01')return 'Carta esclusiva di Eclisse Reale';
 if((mother.level||1)<(def.minShipLevelDraft||1))return 'Livello Eclisse Reale insufficiente';
 const supports=royalSupports(side,ply);
 if(isRoyalModule(def.id)){
  const slot=royalModuleSlot(def.id);
  if(!royalPart(side,slot==='weapon'?'weapons':'generator'))
   return 'Alimentazione del modulo distrutta';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo regale già montato';
 }
 if(['crown-relay','royal-rain','protective-crown','eclipse-sovereign',
  'cross-order','royal-bastion','coordinated-judgment','crown-fusion'].includes(action)&&
  !royalPart(side,'command'))return 'Centralina distrutta: comando regale non operativo';
 if(action==='crown-relay'&&!supports.length)return 'Relè richiede un supporto operativo';
 if(['royal-rain','eclipse-sovereign','cross-order','royal-bastion','crown-fusion'].includes(action)&&
  supports.length<2)return 'Servono due supporti regali operativi';
 if(['protective-crown','coordinated-judgment'].includes(action)&&!supports.length)
  return 'Serve un supporto regale operativo';
 if(POWER_CARDS.has(action)&&!royalPart(side,'weapons')&&
  !royalCapableModule(side,'nx-l01-01',ply))
  return 'Arsenale distrutto: serve Relè della Corona per un comando';
 if(action==='royal-rain'||action==='coordinated-judgment'){
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&!royalUnits(enemy,ply).length)
   return 'Comando regale richiede una unità avversaria';
 }
 if(action==='cross-order'){
  if(!royalVisibleProtections(side,ply).length)
   return 'Ordine incrociato richiede una Difesa scoperta su un supporto';
 }
 if(action==='coordinated-judgment'&&!royalVisibleProtections(side,ply).length)
  return 'Giudizio coordinato richiede una Difesa scoperta con cariche';
 if(action==='crown-fusion'){
  if(!side.fusionLimit||(side.fusionsUsed||0)>=side.fusionLimit)
   return 'La Fusione della Corona è già stata usata o non sbloccata';
  if(supports.some(e=>e.fused)||supports.length!==2)
   return 'Fusione della Corona richiede due supporti originali operativi';
 }
 return '';
}
export function royalChoiceReason(side,enemy,chosen=[],order={},ply=0){
 const actions=chosen.filter(c=>c?.effectSpec?.type==='royal').map(c=>c.effectSpec.action);
 const supports=royalSupports(side,ply),enemyUnits=royalUnits(enemy,ply);
 const target=enemyUnits.find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId)||enemyUnits[0];
 const second=enemyUnits.find(t=>t.kind===order.royalSecondKind&&t.unit.id===order.royalSecondId);
 const chosenCard=chosen.find(c=>c?.effectSpec?.type==='royal'&&POWER_CARDS.has(c.effectSpec.action));
 if(actions.filter(a=>POWER_CARDS.has(a)).length>1)
  return 'Un solo comando offensivo Eclisse Reale per turno';
 if(order.royalRelay){
  if(!royalCapableModule(side,'nx-l01-01',ply)||!royalPart(side,'command'))
   return 'Relè della Corona non operativo';
  if((side.royal?.lastRelayPly??-999)===ply)return 'Relè già utilizzato nel turno';
  if(!chosenCard||!target||!['escort','machine'].includes(target.kind))
   return 'Il Relè richiede un comando offensivo contro una unità';
  if(!supports.some(e=>e.id===order.royalRelayEscortId)&&order.royalRelayEscortId)
   return 'Supporto Relè scelto non operativo';
  if(!supports.length)return 'Relè richiede un supporto operativo';
 }
 if(chosenCard&&!royalPart(side,'weapons')&&!order.royalRelay)
  return 'Arsenale distrutto: seleziona il Relè della Corona';
 if(actions.includes('royal-rain')){
  if(!['heavy','split',null,undefined,''].includes(order.royalRainMode))
   return 'Modalità Pioggia reale non valida';
  if(order.royalRainMode==='split'&&enemyUnits.length<2)
   return 'Pioggia reale doppia richiede due unità distinte';
  if(order.royalRainMode==='split'&&order.royalSecondId&&
   (!second||second.unit.id===target?.unit.id))
   return 'Pioggia reale: secondo bersaglio assente o identico';
 }
 if(actions.includes('protective-crown')&&order.royalGuardEscortId&&
  !supports.some(e=>e.id===order.royalGuardEscortId))
  return 'Corona protettiva: supporto scelto non operativo';
 if(actions.includes('royal-bastion')&&order.royalBastionEscortId&&
  !supports.some(e=>e.id===order.royalBastionEscortId))
  return 'Bastione reale: supporto scelto non operativo';
 if(actions.includes('cross-order')||actions.includes('coordinated-judgment')){
  const protections=royalVisibleProtections(side,ply);
  if(order.royalSourceToken&&!protections.some(p=>p.source===order.royalSourceToken))
   return 'Protezione scoperta non disponibile o senza cariche';
  if(actions.includes('cross-order')){
   const from=protections.find(p=>p.source===order.royalSourceToken)||protections[0];
   if(!from)return 'Ordine incrociato senza Difesa scoperta';
   const sourceEscort=supports.find(e=>e.slot===from.escortSlot);
   const destination=supports.find(e=>e.id===order.royalDestinationEscortId)||
    supports.find(e=>e.id!==sourceEscort?.id);
   if(!destination||destination.id===sourceEscort?.id)
    return 'Ordine incrociato richiede altro supporto operativo';
   if((destination.nebulaNoProtectionUntilPly||0)>ply)
    return 'Il bersaglio non può ricevere nuove protezioni';
  }
 }
 if(actions.includes('crown-fusion')&&
  chosen.filter(c=>c.effectSpec?.type==='fusion').length>0)
  return 'Non puoi effettuare due Fusioni nello stesso turno';
 if(order.royalSovereignTrade){
  const commander=side.commander?.id==='ex-l01-01'&&side.commander.untilPly>ply;
  const playing=actions.includes('eclipse-sovereign');
  if(!commander&&!playing)return 'Sovrano: Personaggio non attivo';
  if(!royalPart(side,'command')||supports.length<2)
   return 'Sovrano richiede due supporti e la Centralina';
  if((side.royal?.lastSovereignPly??-999)===ply)
   return 'Sovrano già utilizzato in questo turno';
  const spent=new Map();
  for(const c of chosen)spent.set(c.id,(spent.get(c.id)||0)+1);
  const remaining=(side.hand||[]).filter(id=>{
   const n=spent.get(id)||0;if(n){spent.set(id,n-1);return false;}return true;
  });
  if(!remaining.length)return 'Sovrano richiede una carta non giocata da scartare';
  if(order.royalDiscardId&&!remaining.includes(order.royalDiscardId))
   return 'La carta scelta dal Sovrano non è rimasta in mano';
  if(order.royalPickId&&![...(side.deck||[]).slice(0,3),
   ...(side.discard||[])].includes(order.royalPickId))
   return 'La carta scelta dal Sovrano non è fra le prime tre';
 }
 return '';
}
