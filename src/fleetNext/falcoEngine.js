// Falco Binario R01: colpi differiti, un'unica zona di preparazione e due difese.
export const FALCO_ACTIONS=Object.freeze({
 'nx-r01-01':'binary-capacitor',
 'nx-r01-02':'siege-shot',
 'nx-r01-03':'calibration-shot',
 'nx-r01-04':'armored-chamber',
 'ex-r01-01':'binary-gunner',
 'nx-r01-06':'ballistic-correction',
 'nx-r01-07':'double-chamber',
 'nx-r01-08':'guardian-falcon',
 'nx-r01-09':'emergency-loader',
 'nx-r01-10':'falcon-triangulation'
});
export const FALCO_PREP_ACTIONS=Object.freeze([
 'siege-shot','double-chamber','falcon-triangulation'
]);
export const FALCO_MODULE_SLOTS=Object.freeze({'nx-r01-01':'weapon'});
export const FALCO_ATTACK_ACTIONS=Object.freeze([
 ...FALCO_PREP_ACTIONS,'calibration-shot'
]);
export const isFalcoModule=id=>Object.hasOwn(FALCO_MODULE_SLOTS,id);
export const falcoModuleSlot=id=>FALCO_MODULE_SLOTS[id]||null;
export const isFalcoPreparation=id=>FALCO_PREP_ACTIONS.includes(FALCO_ACTIONS[id]);
export const falcoUnitAlive=u=>!!u&&u.hp>0&&!u.destroyed;
const vitalActive=(side,id)=>side?.ships?.[0]?.parts?.some(p=>
 p.id===id&&falcoUnitAlive(p));
export const falcoEscortReady=(side,e,ply=0)=>falcoUnitAlive(e)&&
 (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
 (e.skill?.requires||[]).every(id=>vitalActive(side,id));
export const falcoUnits=(side)=>[
 ...(side?.escorts||[]).filter(falcoUnitAlive).map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(falcoUnitAlive).map(unit=>({kind:'machine',unit}))
];
export function ensureFalcoState(side){
 side.falco??={pending:null,gunnerUsedPly:-999,serial:0};
 return side.falco;
}
export function falcoPending(side){return side?.falco?.pending||null;}
export const falcoCapacitorActive=(side,ply=0)=>{
 const m=side?.modules?.weapon;
 return m?.cardId==='nx-r01-01'&&falcoUnitAlive(m)&&
 (m.disabledUntilPly||0)<=ply&&vitalActive(side,'weapons');
};
export function falcoPrecondition(def,side,battle=null){
 const action=FALCO_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply??0;
 if(mother?.id!=='R01')return 'Carta esclusiva del Falco Binario';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello Falco insufficiente';
 if(isFalcoModule(def.id)){
  if(!vitalActive(side,'weapons'))return 'Il Capacitore richiede l’Arsenale';
  if(side.modules?.weapon?.cardId===def.id)return 'Capacitore già montato';
 }
 if(FALCO_ATTACK_ACTIONS.includes(action)&&!vitalActive(side,'weapons'))
  return 'Arsenale distrutto: non puoi preparare o sparare';
 const state=side.falco||{pending:null},q=state.pending;
 if(FALCO_PREP_ACTIONS.includes(action)){
  if(q&&q.releasePly>ply)return 'Colpo già in preparazione';
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&!falcoUnits(enemy).length)return 'Nessuna unità avversaria da mirare';
 }
 if(action==='armored-chamber'){
  if(!falcoCapacitorActive(side,ply)||!(q||(side.hand||[]).some(id=>
   FALCO_PREP_ACTIONS.includes(FALCO_ACTIONS[id]))))
   return 'Camera blindata richiede Capacitore con colpo preparato';
 }
 if(action==='guardian-falcon'){
  const first=(side.escorts||[]).find(e=>e.sourceIndices?.includes(0));
  if(!vitalActive(side,'command')||!first||(first.grade||1)<2||
   !falcoEscortReady(side,first,ply))
   return 'Falco guardiano richiede Centralina e primo supporto di grado 2 operativo';
  if(!vitalActive(side,'generator'))return 'Generatore non disponibile';
 }
 if(action==='falcon-triangulation'){
  const guards=(side.escorts||[]).filter(e=>falcoEscortReady(side,e,ply));
  if(!vitalActive(side,'command')||guards.length<2||
   guards.some(e=>(e.grade||1)<2))
   return 'Triangolazione richiede Centralina e due supporti di grado 2 operativi';
  const enemy=battle?(battle.sides.A===side?battle.sides.B:battle.sides.A):null;
  if(enemy&&falcoUnits(enemy).length<2)
   return 'Triangolazione richiede due unità avversarie diverse';
 }
 return '';
}
