// Eclissi Stellare — Squalo del Vuoto (R04), 10 esclusive a ritorsione reale.
// Nessuna reazione a costi o contrattacchi; nessuna unità sostituita gratuitamente.
export const SHARK_ACTIONS=Object.freeze({
 'nx-r04-01':'toothed-armor',
 'nx-r04-02':'void-bite',
 'nx-r04-03':'abyssal-decoy',
 'nx-r04-04':'returning-teeth',
 'ex-r04-01':'abyssal-admiral',
 'nx-r04-06':'retaliation-torpedo',
 'nx-r04-07':'predator-harpoon',
 'nx-r04-08':'predator-shield',
 'nx-r04-09':'ruthless-response',
 'nx-r04-10':'last-bite'
});
export const SHARK_MODULE_SLOTS=Object.freeze({
 'nx-r04-01':'utility','nx-r04-07':'weapon'
});
export const SHARK_ATTACK_ACTIONS=Object.freeze([
 'void-bite','retaliation-torpedo','ruthless-response'
]);
export const isSharkModule=id=>Object.hasOwn(SHARK_MODULE_SLOTS,id);
export const sharkModuleSlot=id=>SHARK_MODULE_SLOTS[id]||null;
export const sharkAlive=u=>!!u&&u.hp>0&&!u.destroyed;
const partActive=(side,id)=>!!side?.ships?.[0]?.parts?.some(p=>p.id===id&&sharkAlive(p));
const available=(u,ply)=>sharkAlive(u)&&
 (u.disabledUntilPly||0)<=ply&&(u.jammedUntilPly||0)<=ply;
export function sharkActiveSupports(side,ply=0){
 return (side?.escorts||[]).filter(e=>available(e,ply)&&
  (e.skill?.requires||[]).every(id=>partActive(side,id)));
}
export const sharkActiveMachines=(side,ply=0)=>(side?.machines||[]).filter(m=>available(m,ply));
export const sharkUnits=(side)=>[
 ...(side?.escorts||[]).filter(sharkAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(sharkAlive).map(unit=>({kind:'machine',unit}))
];
export const sharkOperationalUnits=(side,ply=0)=>[
 ...sharkActiveSupports(side,ply).map(unit=>({kind:'escort',unit})),
 ...sharkActiveMachines(side,ply).map(unit=>({kind:'machine',unit}))
];
export const sharkWoundedSupports=(side,ply=0)=>
 sharkActiveSupports(side,ply).filter(e=>e.hp<e.maxHp);
export const sharkWoundedMachines=(side,ply=0)=>
 sharkActiveMachines(side,ply).filter(m=>m.hp<m.maxHp);
export function ensureSharkState(side){
 side.shark??={lastEnemyLossPly:-999,armorFiredPly:-999,admiralUsedPly:-999,
  admiralDiscardId:null,admiralEnabled:true};
 return side.shark;
}
export function sharkModuleActive(side,slot,cardId,ply=0){
 const module=side?.modules?.[slot];
 return side?.ships?.[0]?.id==='R04'&&module?.cardId===cardId&&
  available(module,ply)&&partActive(side,slot==='weapon'?'weapons':'generator');
}
export function sharkPrecondition(def,side,battle=null){
 const action=SHARK_ACTIONS[def?.id],ply=battle?.ply??0;
 if(!action)return '';
 if(side?.ships?.[0]?.id!=='R04')return 'Carta esclusiva dello Squalo del Vuoto';
 if((side.ships[0].level||1)<(def.minShipLevelDraft||1))return 'Livello Squalo insufficiente';
 if(isSharkModule(def.id)){
  const slot=sharkModuleSlot(def.id);
  if(!partActive(side,slot==='weapon'?'weapons':'generator'))
   return 'Sistema di alimentazione del modulo non operativo';
  if(side.modules?.[slot]?.cardId===def.id)return 'Modulo Squalo già montato';
 }
 const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
 const enemyUnits=enemy?sharkUnits(enemy):[];
 const units=sharkOperationalUnits(side,ply);
 if(action==='toothed-armor'&&enemy&&!enemyUnits.length)
  return 'Corazza dentata richiede un bersaglio nemico da fissare';
 if(SHARK_ATTACK_ACTIONS.includes(action)&&!partActive(side,'weapons'))
  return 'Arsenale distrutto: attacco Squalo non disponibile';
 if(['void-bite','retaliation-torpedo'].includes(action)&&enemy&&!enemyUnits.length)
  return 'L’attacco Squalo richiede un supporto o una macchina nemici';
 if(action==='abyssal-decoy'&&units.length<2)
  return 'Esca abissale richiede due unità alleate operative';
 if(action==='returning-teeth'&&enemy&&enemyUnits.length<2)
  return 'Denti di ritorno richiede due bersagli nemici distinti alla posa';
 if(action==='retaliation-torpedo'&&!sharkWoundedMachines(side,ply).length)
  return 'Siluro di ritorsione richiede una macchina propria danneggiata';
 if(action==='predator-shield'&&!sharkWoundedSupports(side,ply).length)
  return 'Scudo del predatore richiede un supporto ferito e operativo';
 if(action==='ruthless-response'){
  if((side.shark?.lastEnemyLossPly??-999)!==ply-1)
   return 'Risposta spietata richiede una tua unità distrutta dall’ultimo attacco avversario';
  if(enemy&&!enemy.ships?.[0]?.parts?.some(sharkAlive))
   return 'Nessun vitale nemico raggiungibile';
 }
 if(action==='last-bite'){
  if(!partActive(side,'command'))return 'Ultimo morso richiede la Centralina';
  const supports=sharkActiveSupports(side,ply);
  if(supports.length<2||!supports.some(e=>e.hp<e.maxHp&&
   supports.some(other=>other.id!==e.id&&other.hp<other.maxHp)))
   return 'Ultimo morso richiede due supporti collegati, entrambi feriti';
 }
 return '';
}
