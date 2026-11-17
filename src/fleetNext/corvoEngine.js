// Corvo a Impulsi C03 — dieci esclusive, stato e prerequisiti.
// Silenzio = solo passiva; disattivazione = niente azioni né protezione.
// Nessun disturbo può essere rinnovato sullo stesso bersaglio in turni consecutivi.
export const CORVO_ACTIONS=Object.freeze({
 'nx-c03-01':'disturbance-antenna',
 'nx-c03-02':'intermittent-dart',
 'nx-c03-03':'reserve-channel',
 'nx-c03-04':'return-echo',
 'ex-c03-01':'resonant-commander',
 'nx-c03-06':'frequency-analysis',
 'nx-c03-07':'targeted-short',
 'nx-c03-08':'reverse-recall',
 'nx-c03-09':'safety-switch',
 'nx-c03-10':'selective-blackout'
});
export const CORVO_MODULE_SLOTS=Object.freeze({
 'nx-c03-01':'weapon','nx-c03-09':'utility'
});
export const CORVO_ATTACK_ACTIONS=Object.freeze(['intermittent-dart','targeted-short']);
export const isCorvoModule=id=>Object.hasOwn(CORVO_MODULE_SLOTS,id);
export const corvoModuleSlot=id=>CORVO_MODULE_SLOTS[id]||null;
export const corvoModuleActive=(module,ply)=>!!module&&module.hp>0&&
 !module.destroyed&&(module.disabledUntilPly||0)<=ply;
export const unitSilenced=(unit,ply)=>!!unit&&unit.hp>0&&
 !unit.destroyed&&(unit.silencedUntilPly||0)>ply;
export const canApplyCorvoStatus=(unit,ply,kind='silenced')=>
 !!unit&&unit.hp>0&&!unit.destroyed&&
 (unit[(kind==='disabled'?'disabledUntilPly':'silencedUntilPly')]||0)<=ply&&
 (unit[(kind==='disabled'?'lastDisabledPly':'lastSilencedPly')]??-999)<ply-2;
export function ensureCorvoState(side){
 side.corvo??={firstSilencePly:-999,commanderPeekPly:-999,
  scannedTrapId:null,scanPly:-999,skippedPassives:{}};
 side.corvo.skippedPassives??={};
 return side.corvo;
}
const active=(mother,id)=>mother?.parts?.some(p=>p.id===id&&p.hp>0&&!p.destroyed);
const enabledEscort=(side,e,ply)=>!!e&&e.hp>0&&!e.destroyed&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>active(side.ships[0],id));
export function corvoPrecondition(def,side,battle=null){
 const action=CORVO_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='C03')return 'Carta esclusiva di Corvo a Impulsi';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello Corvo insufficiente';
 if(isCorvoModule(def.id)){
  const slot=corvoModuleSlot(def.id);
  if(!active(mother,slot==='weapon'?'weapons':'generator'))
   return 'Alimentazione del modulo distrutta';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo identico già montato';
 }
 if(CORVO_ATTACK_ACTIONS.includes(action)&&!active(mother,'weapons'))
  return 'Arsenale distrutto';
 const enemy=battle?battle.sides.A===side?battle.sides.B:battle.sides.A:null;
 if(action==='reserve-channel'){
  if(!active(mother,'command'))return 'Canale di riserva richiede la Centralina';
  if(!(side.escorts||[]).some(e=>enabledEscort(side,e,ply)))
   return 'Canale di riserva richiede un supporto operativo';
 }
 if(action==='frequency-analysis'&&(side.hand||[]).filter(x=>x!==def.id).length===0)
  return 'Analisi di frequenza richiede una carta da scambiare';
 if(action==='targeted-short'&&enemy&&!(enemy.machines||[]).some(m=>m.hp>0&&!m.destroyed))
  return 'Cortocircuito mirato richiede una macchina nemica';
 if(action==='reverse-recall'){
  if(!active(mother,'command'))return 'Richiamo inverso richiede la Centralina';
  const first=(side.escorts||[]).find(e=>e.sourceIndices?.includes(0)&&!e.fused);
  if(!first||!enabledEscort(side,first,ply)||(first.grade||1)<2)
   return 'Richiamo inverso richiede il primo supporto di grado 2 operativo';
  if(unitSilenced(first,ply))return 'Il primo supporto ha la passiva silenziata';
  if(!['jam','ion','strike','corrode','guard','repair','mend','draw',
   'precision','pierce','focus','siege','revenge','surge'].includes(first.skill?.action))
   return 'Il primo supporto non ha una passiva attivabile';
 }
 if(action==='selective-blackout'&&enemy){
  const m=enemy.modules?.weapon;
  if(!corvoModuleActive(m,ply))return 'Nessun modulo d’arma nemico operativo';
  const guards=(enemy.escorts||[]).some(e=>enabledEscort(enemy,e,ply))||
   (enemy.machines||[]).some(u=>u.hp>0&&!u.destroyed&&
    (u.disabledUntilPly||0)<=ply&&(u.jammedUntilPly||0)<=ply);
  if(guards)return 'Il modulo d’arma è protetto: elimina prima le unità';
  if(!canApplyCorvoStatus(m,ply,'disabled'))return 'Il modulo è immune a blocchi consecutivi';
 }
 return '';
}
