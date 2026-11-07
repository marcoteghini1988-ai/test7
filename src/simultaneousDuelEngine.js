// Eclissi Stellare: sandbox deterministico del duello tattico simultaneo.
// NON viene usato dalla campagna/PvP ufficiale e NON accredita ricompense.
// Gli armamenti sono i 42 del catalogo esistente: i calcoli non alimentano lo scudo.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {
  VITAL_IDS,createMotherDefense,damageMotherShield,exposeMotherPart,
  hitMotherPart,remainingExposureSlots,matchesVitalSignature,motherDestroyed
} from './vitalDefense.js';

export const TACTICAL_TIMING=Object.freeze({prepareMs:30000,resolveMs:8000,maxRounds:20});
export const TACTICAL_SPECIALS=Object.freeze({
 'tactic-power-shift':{name:'Deviazione energia',kind:'offense',help:'+6 danni alla barriera, ma subisci +3 al prossimo attacco'},
 'tactic-scan':{name:'Scansione tattica',kind:'intel',help:'Rivela le firme di due vitali nemici'},
 'tactic-suppress':{name:'Soppressione scorta',kind:'offense',help:'Una scudiera nemica non intercetta nel prossimo scontro'},
 'fusion-barrier':{name:'Fusione barriera',kind:'fusion',help:'100 Sincronia; scudiera protegge usando il suo scudo reale'},
 'tactic-counter':{name:'Contromisura programmata',kind:'reaction',help:'Blocca il prossimo colpo a un vitale indicato, solo in questo scontro'},
 'tactic-reactive':{name:'Paratia reattiva',kind:'defense',help:'Assorbe 9 danni alla barriera nel prossimo scontro'},
 'tactic-kinetic':{name:'Carica cinetica',kind:'offense',help:'+6 danni alla barriera nel prossimo scontro'},
 'tactic-impact':{name:"Schermo d'urto",kind:'defense',help:'Riduce del 20% il pacchetto sulla barriera'},
 'support-shield-repair':{name:'Riparazione scudo',kind:'support',help:'+20 HP alla barriera se il generatore è attivo'},
 'shot-piercing':{name:'Colpo perforante',kind:'offense',help:'Bypassa intercettazione scudiera sul 20% del pacchetto, non le firme'},
 'shot-ion':{name:'Impulso ionico',kind:'control',help:'Intercettazioni nemiche ridotte nello scontro successivo'},
 'tactic-numeric-recycle':{name:'Ricambio numerico',kind:'support',help:'Scarta fino a due carte numeriche a fine scontro e ripescale'}
});
export const TACTICAL_STARTER_TYPES=Object.freeze(Object.keys(TACTICAL_SPECIALS).flatMap(type=>[type,type]));
const CARD_SUITS=['♣','♦','♥','♠'];
const NATIVE_GUNS=PHASE1_CATALOG.weapons;
const SHIPS=PHASE1_CATALOG.ships;
const NUMERIC_STARTS={
 A:[[3,'♣'],[4,'♣'],[5,'♥'],[8,'♦'],[7,'♠'],[7,'♥'],[9,'♣']],
 B:[[8,'♥'],[5,'♣'],[3,'♠'],[4,'♦'],[4,'♠'],[7,'♣'],[7,'♦']]
};
const SPECIAL_STARTS={
 A:['tactic-power-shift','tactic-scan','tactic-suppress','fusion-barrier','tactic-counter'],
 B:['tactic-reactive','tactic-scan','tactic-kinetic','tactic-counter','tactic-impact']
};
const SIGNATURES=Object.freeze({
 engine:{kind:'mathGate',op:'times',target:12,allowedCardCounts:[2,3]},
 weapons:{kind:'mathGate',op:'minus',target:3,allowedCardCounts:[2,3]},
 shieldGenerator:{kind:'mathGate',op:'plus',target:9,allowedCardCounts:[2,3]},
 command:{kind:'poker',pattern:'pair'}
});
export const TACTICAL_SIGNATURES=SIGNATURES;
const clone=o=>structuredClone(o);
const positive=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
const other=side=>side==='A'?'B':'A';
const seedRandom=seed=>{let x=seed>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}};
const shuffle=(array,rand)=>{const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function numericPile(key,seed){
 const start=NUMERIC_STARTS[key];
 const all=CARD_SUITS.flatMap(suit=>Array.from({length:13},(_,i)=>({
   id:key+'-n-'+suit+'-'+(i+1),suit,value:i+1
 })));
 const hand=start.map(([value,suit])=>all.find(c=>c.value===value&&c.suit===suit));
 const ids=new Set(hand.map(c=>c.id));
 return {hand,deck:shuffle(all.filter(c=>!ids.has(c.id)),seedRandom(seed)),discard:[]};
}
function specialPile(key,seed){
 const cards=TACTICAL_STARTER_TYPES.map((type,i)=>({id:key+'-s-'+i,type}));
 // Pick one actual instance for every preselected type.
 const used=new Set();
 const realHand=SPECIAL_STARTS[key].map(type=>{
   const card=cards.find(c=>c.type===type&&!used.has(c.id));used.add(card.id);return card;
 });
 return {hand:realHand,deck:shuffle(cards.filter(c=>!used.has(c.id)),seedRandom(seed)),discard:[]};
}
function nativeWeapons(shipId,level){
 return NATIVE_GUNS.filter(w=>w.nave_id===shipId).map(w=>({
   id:w.id,name:w.nome,kind:w.tipo,visual:w.effetto_visivo,
   damage:w.danno_colpo_L1+Math.floor((w.danno_colpo_L5-w.danno_colpo_L1)*(level-1)/4)
 }));
}
export function nativeBarrierPacket(side){
 let amount=side.weapons.reduce((sum,w)=>sum+w.damage*(w.kind==='Accumulo'?3:4),0);
 const d=side.defense.parts;
 if(d.weapons.hp===0)amount=Math.floor(amount*.5);
 if(d.engine.hp===0)amount=Math.floor(amount*.75);
 return amount;
}
function createSide(key,shipId,level,seed){
 const ship=SHIPS.find(x=>x.id===shipId);
 if(!ship||!Number.isInteger(level)||level<1||level>5)throw new Error('Navicella o livello non valido');
 const defense=createMotherDefense({shipId,shieldMax:60,partHp:10,signatures:SIGNATURES});
 const escortCount=level>=5?2:level>=3?1:0;
 return {key,shipId,name:ship.nome,level,weapons:nativeWeapons(shipId,level),defense,
  escorts:Array.from({length:escortCount},(_,i)=>({id:key+'-escort-'+i,hp:20,max:20})),
  sync:0,ionized:false,seen:[],numeric:numericPile(key,seed+3),special:specialPile(key,seed+13)};
}
export function createTacticalDuel({shipA='C01',shipB='R04',levelA=3,levelB=3,seed=18,nowMs=0}={}){
 if(!Number.isFinite(nowMs))throw new Error('Orologio non valido');
 return {schemaVersion:1,phase:'planning',round:1,deadlineMs:nowMs+TACTICAL_TIMING.prepareMs,
  resolveUntilMs:null,orders:{A:null,B:null},winner:null,
  sides:{A:createSide('A',shipA,levelA,seed),B:createSide('B',shipB,levelB,seed+43)},
  history:[],lastEvents:[]};
}
function uniqueIndices(value,max,limit){
 return Array.isArray(value)&&value.length<=limit&&value.every(x=>Number.isInteger(x)&&x>=0&&x<max)&&new Set(value).size===value.length;
}
const EMPTY_ORDER=Object.freeze({specialIndices:[],numericIndices:[],vitalId:null,op:null,counterVitalId:null,exchangeIndices:[]});
export function validateTacticalOrder(battle,key,order){
 if(battle?.phase!=='planning'||!['A','B'].includes(key)||battle.orders[key])return {ok:false,reason:'already_committed'};
 if(!order||typeof order!=='object')return {ok:false,reason:'invalid_order'};
 const side=battle.sides[key];
 const si=order.specialIndices??[],ni=order.numericIndices??[],ei=order.exchangeIndices??[];
 if(!uniqueIndices(si,side.special.hand.length,2))return {ok:false,reason:'special_selection'};
 if(!uniqueIndices(ni,side.numeric.hand.length,3))return {ok:false,reason:'numeric_selection'};
 if(!uniqueIndices(ei,side.numeric.hand.length,2))return {ok:false,reason:'exchange_selection'};
 const types=si.map(i=>side.special.hand[i].type);
 if(new Set(types).size!==types.length)return {ok:false,reason:'duplicate_special'};
 if(ni.length!==0&&![2,3].includes(ni.length))return {ok:false,reason:'numeric_count'};
 if(ni.length>0&&(!VITAL_IDS.includes(order.vitalId)||!['plus','minus','times','divide','pair'].includes(order.op)))return {ok:false,reason:'invalid_precision'};
 if(!types.includes('tactic-numeric-recycle')&&ei.length)return {ok:false,reason:'recycle_requires_card'};
 if(ni.some(i=>ei.includes(i)))return {ok:false,reason:'card_double_spend'};
 if(types.includes('fusion-barrier')&&(!side.escorts.some(e=>e.hp>0)||side.sync<100||side.defense.parts.command.hp<=0||side.defense.parts.engine.hp<=0))
   return {ok:false,reason:'fusion_unavailable'};
 if(types.includes('tactic-counter')&&!VITAL_IDS.includes(order.counterVitalId))return {ok:false,reason:'counter_target'};
 if(types.includes('support-shield-repair')&&(side.defense.parts.shieldGenerator.hp<=0||side.defense.shield.hp>=side.defense.shield.max))
   return {ok:false,reason:'repair_unavailable'};
 return {ok:true};
}
export function sealTacticalOrder(battle,key,order=EMPTY_ORDER,nowMs=0){
 const ok=validateTacticalOrder(battle,key,order);
 if(!ok.ok)return {ok:false,reason:ok.reason,battle};
 if(nowMs>=battle.deadlineMs)return {ok:false,reason:'preparation_expired',battle};
 const normalized={
  specialIndices:[...(order.specialIndices??[])],numericIndices:[...(order.numericIndices??[])],
  vitalId:order.numericIndices?.length?order.vitalId:null,op:order.numericIndices?.length?order.op:null,
  counterVitalId:order.counterVitalId??null,exchangeIndices:[...(order.exchangeIndices??[])]
 };
 const next={...battle,orders:{...battle.orders,[key]:normalized}};
 return {ok:true,battle:next};
}
function recyclePile(pile,indices,size,random){
 const spent=indices.map(i=>pile.hand[i]);
 const keep=pile.hand.filter((_,i)=>!indices.includes(i));
 let deck=[...pile.deck],discard=[...pile.discard,...spent],hand=[...keep];
 while(hand.length<size){
  if(!deck.length){if(!discard.length)break;deck=shuffle(discard,random);discard=[];}
  hand.push(deck.shift());
 }
 return {hand,deck,discard};
}
function specialTypes(side,order){return order.specialIndices.map(i=>side.special.hand[i].type);}
function applyPreparation(sides,orders,log){
 const status={};
 for(const key of ['A','B']){
  const side=sides[key],enemy=sides[other(key)],types=specialTypes(side,orders[key]);
  const active={types,newCounter:types.includes('tactic-counter')?orders[key].counterVitalId:null,
   interceptDisabled:types.includes('tactic-suppress'),fusion:types.includes('fusion-barrier'),piercing:types.includes('shot-piercing')};
  if(types.includes('support-shield-repair')){
   const shield=side.defense.shield;
   const fixed=Math.min(20,shield.max-shield.hp);
   side.defense={...side.defense,shield:{...shield,hp:shield.hp+fixed}};
   log.push(key+': barriera riparata +'+fixed);
  }
  if(types.includes('tactic-scan')){
   const next=VITAL_IDS.filter(id=>!side.seen.includes(id)).slice(0,2);
   side.seen=[...side.seen,...next];
   log.push(key+': scansione, firme rivelate: '+next.join(', '));
  }
  if(active.fusion){side.sync-=100;log.push(key+': fusione difensiva con scudiera, costo 100 Sincronia');}
  if(types.includes('shot-ion'))enemy.ionized=true;
  status[key]=active;
 }
 return status;
}
function applyBarrierAttack(sides,key,orders,status,log){
 const atk=sides[key],def=sides[other(key)],t=status[key],res=status[other(key)];
 let total=nativeBarrierPacket(atk)+ (t.types.includes('tactic-power-shift')?6:0)+
  (t.types.includes('tactic-kinetic')?6:0);
 if(res.types.includes('tactic-power-shift'))total+=3;
 const before=total;
 if(res.types.includes('tactic-reactive'))total=Math.max(0,total-9);
 if(res.types.includes('tactic-impact'))total=Math.floor(total*.8);
 let intercepted=0;
 if(def.defense.parts.command.hp>0&&!t.interceptDisabled){
  for(const e of def.escorts){
   if(e.hp<=0)continue;
   const share=res.fusion?.60:(def.ionized?.10:.20);
   let take=Math.min(e.hp,Math.floor(total*share));
   e.hp-=take;intercepted+=take;total-=take;
   if(res.fusion)break;
  }
 }
 const hit=damageMotherShield(def.defense,total);
 def.defense=hit.defense;
 log.push(key+': armi native '+atk.weapons.map(w=>w.name).join(' + ')+
  ' ('+before+' potenziali, '+intercepted+' intercettati), barriera '+hit.damage);
 return hit.damage;
}
function applyVitalAttack(sides,key,order,status,log){
 const atk=sides[key],def=sides[other(key)];
 if(!order.numericIndices.length)return 0;
 const cards=order.numericIndices.map(i=>atk.numeric.hand[i]);
 const target=order.vitalId;
 let defense=def.defense;
 const signature=defense.parts[target].signature;
 const matches=matchesVitalSignature(signature,cards);
 if(!matches||((signature?.kind==='poker')!==(order.op==='pair'))){
  log.push(key+': combinazione non valida per '+target+' — numeriche consumate');
  return 0;
 }
 if(signature?.kind!=='poker'&&signature.op!==order.op){
  log.push(key+': operazione non valida per '+target);return 0;
 }
 if(!defense.parts[target].exposed&&remainingExposureSlots(defense)>0)
   defense=exposeMotherPart(defense,target).defense;
 if(!defense.parts[target].exposed){
  log.push(key+': '+target+' ancora protetto dalla barriera');return 0;
 }
 if(status[other(key)].newCounter===target){
  log.push(key+': attacco a '+target+' respinto da Contromisura programmata');
  return 0;
 }
 let damage=10;
 const protector=def.escorts.find(e=>e.hp>0);
 if(status[other(key)].fusion&&protector){
  const absorbed=Math.min(protector.hp,Math.floor(damage*.60));
  protector.hp-=absorbed;damage-=absorbed;
  log.push(other(key)+': scudiera fusa assorbe '+absorbed+' HP reali');
 }
 const hit=hitMotherPart(defense,target,damage,cards);
 def.defense=hit.defense;
 if(target==='shieldGenerator'&&hit.destroyed){
  // La barriera madre collassa quando il suo vero generatore va KO.
  def.defense=damageMotherShield(def.defense,def.defense.shield.hp).defense;
  log.push(other(key)+': generatore KO, barriera collassata e riparazioni impossibili');
 }
 log.push(key+': '+target+' '+(hit.reason==='hit'?'-'+hit.damage+' HP'+(hit.destroyed?' [KO]':''):'nessun danno: '+hit.reason));
 return hit.damage||0;
}
function winState(sides){
 const a=motherDestroyed(sides.A.defense),b=motherDestroyed(sides.B.defense);
 return a&&b?'draw':a?'B':b?'A':null;
}
function resolveCycle(battle,nowMs){
 const sides=clone(battle.sides),orders=clone(battle.orders);
 const log=['Scontro '+battle.round+' — ordini rivelati simultaneamente'];
 const status=applyPreparation(sides,orders,log);
 const a=applyBarrierAttack(sides,'A',orders,status,log);
 const b=applyBarrierAttack(sides,'B',orders,status,log);
 const hitsA=applyVitalAttack(sides,'A',orders.A,status,log);
 const hitsB=applyVitalAttack(sides,'B',orders.B,status,log);
 for(const key of ['A','B']){
  const side=sides[key],order=orders[key];
  const random=seedRandom((battle.round*997+ (key==='A'?199:311))>>>0);
  side.special=recyclePile(side.special,order.specialIndices,5,random);
  side.numeric=recyclePile(side.numeric,[...order.numericIndices,...order.exchangeIndices],7,random);
  side.sync=Math.min(100,side.sync+25+((key==='A'?hitsA:hitsB)>0?25:0));
  side.ionized=false;
 }
 let winner=winState(sides);
 if(battle.round>=TACTICAL_TIMING.maxRounds&&!winner)winner='draw';
 log.push('Barriere: A '+sides.A.defense.shield.hp+'/60; B '+sides.B.defense.shield.hp+'/60');
 if(winner)log.push(winner==='draw'?'Pareggio: limite/doppio KO':'Vince '+winner);
 return {...battle,sides,phase:'resolving',resolveUntilMs:nowMs+TACTICAL_TIMING.resolveMs,
  orders,history:[...battle.history,{round:battle.round,orders,events:log,shieldA:a,shieldB:b,hitsA,hitsB}],lastEvents:log,winner};
}
export function advanceTacticalDuel(battle,nowMs=0){
 if(!Number.isFinite(nowMs))throw new Error('Orologio non valido');
 if(battle.phase==='finished')return battle;
 if(battle.phase==='resolving'){
  if(nowMs<battle.resolveUntilMs)return battle;
  if(battle.winner)return {...battle,phase:'finished'};
  return {...battle,phase:'planning',round:battle.round+1,orders:{A:null,B:null},
   deadlineMs:nowMs+TACTICAL_TIMING.prepareMs,resolveUntilMs:null};
 }
 if(battle.phase!=='planning')return battle;
 if(battle.orders.A&&battle.orders.B||nowMs>=battle.deadlineMs){
  const orders={A:battle.orders.A??clone(EMPTY_ORDER),B:battle.orders.B??clone(EMPTY_ORDER)};
  return resolveCycle({...battle,orders},nowMs);
 }
 return battle;
}
