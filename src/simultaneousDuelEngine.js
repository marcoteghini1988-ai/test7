// Eclissi Stellare: motore deterministico del duello tattico simultaneo ufficiale.
// Usato nella plancia 3D della campagna standard; i premi vengono assegnati dal controller, non dal motore.
// Gli armamenti sono i 42 del catalogo esistente: i calcoli non alimentano lo scudo.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createExclusiveBossState,exclusiveBossShieldFactor,rememberExclusiveBossDefenseHit,
 exclusiveBossNativeBonus,rememberExclusiveBossNativeHit} from './tacticalExclusiveBosses.js';
import {arenaPhaseModifiers,arenaEnvironment} from './battleArenas.js';
import {tacticalShipSignatures,tacticalSignatureMatches} from './tacticalShipSignatures.js';
import {tacticalCommanderReady,tacticalCommanderVolleyBonus} from './tacticalCommanders.js';
import {equipTacticalBossDeck,tacticalBossMotherFactor,rememberTacticalBossMotherHit,
 tacticalBossVitalBonus,rememberTacticalBossVitalHit,tacticalBossConditionSnapshot,
 tacticalBossOutgoingBonus,rememberTacticalBossOutgoingHit,
 tacticalIdraBonus,rememberTacticalIdraHit,
 tacticalLeviatanoBonus,rememberTacticalLeviatanoHit,
 rememberTacticalLeviatanoRecycle} from './tacticalBossDecks.js';
import {tacticalBarrierPower,focusedTacticalTechnology} from './tacticalArmamentBalance.js';
import {escortInterceptionEfficiency} from './fleetSystems.js';
import {tacticalVitalTransition} from './tacticalVitalConsequences.js';
import {TACTICAL_EPIC_CARDS,isTacticalEpic,tacticalEpicCritical,tacticalEpicActive} from './tacticalEpicCards.js';
import {activateTacticalEpic,expireTacticalEpic,prepareTacticalEpicChoice,tacticalEpicMatriceDamage,tacticalEpicNumericChoice,tacticalEpicProtectsFromHeat,resolveTacticalEpicAfterCombat} from './tacticalEpicRuntime.js';
import {
  VITAL_IDS,createMotherDefense,damageMotherShield,restoreMotherShield,exposeMotherPart,
  hitMotherPart,remainingExposureSlots,motherDestroyed
} from './vitalDefense.js';

export const TACTICAL_TIMING=Object.freeze({prepareMs:30000,resolveMs:8000,maxRounds:20});
export const TACTICAL_SPECIALS=Object.freeze({
 'tactic-power-shift':{name:'Deviazione energia',kind:'offense',help:'+6 danni alla barriera, ma subisci +3 al prossimo attacco'},
 'tactic-scan':{name:'Scansione tattica',kind:'intel',help:'Rivela le firme di due vitali nemici'},
 'tactic-suppress':{name:'Soppressione scorta',kind:'offense',help:'Disattiva l’intercettazione della prima scudiera nemica attiva per questo scontro'},
 'fusion-barrier':{name:'Fusione barriera',kind:'fusion',help:'100 Sincronia; scudiera protegge usando il suo scudo reale'},
 'tactic-counter':{name:'Contromisura programmata',kind:'reaction',help:'Blocca il prossimo colpo a un vitale indicato, solo in questo scontro'},
 'tactic-reactive':{name:'Paratia reattiva',kind:'defense',help:'Assorbe 9 danni alla barriera nel prossimo scontro'},
 'tactic-kinetic':{name:'Carica cinetica',kind:'offense',help:'+6 danni alla barriera nel prossimo scontro'},
 'tactic-impact':{name:"Schermo d'urto",kind:'defense',help:'Riduce del 20% il pacchetto sulla barriera'},
 'support-shield-repair':{name:'Riparazione scudo',kind:'support',help:'+20 HP alla barriera se il generatore è attivo'},
 'shot-piercing':{name:'Colpo perforante',kind:'offense',help:'Bypassa intercettazione scudiera sul 20% del pacchetto, non le firme'},
 'shot-ion':{name:'Impulso ionico',kind:'control',help:'Se la barriera nemica subisce danno, l’intercettazione delle scudiere si riduce nello scontro successivo'},
 'tactic-numeric-recycle':{name:'Ricambio numerico',kind:'support',help:'Scarta fino a due carte numeriche a fine scontro e ripescale'},
 'fusion-strike':{name:'Fusione Assalto',kind:'fusion',help:'Una scudiera viva, 100 Sincronia: +25% barriera madre, scudiera agganciata senza fuoco autonomo'},
 'fusion-twin':{name:'Fusione Gemellare',kind:'fusion',help:'Due scudiere vive, 100 Sincronia: intercettazione fino al 55% su HP veri'},
 'fusion-triad':{name:'Fusione Trina',kind:'fusion',help:'Due scudiere vive, 100 Sincronia: +35% barriera e intercettazione fino al 40% su HP veri'},
 'tactical-cover':{name:'Copertura Tattica',kind:'defense',help:'Scudiera viva: fino al 75% di un impatto assorbito dal suo scudo reale'},
 'shot-corrosion':{name:'Corrosione',kind:'control',help:'Se la barriera subisce un colpo, il successivo colpo nativo infligge +25% alla barriera'},
 'support-status-purge':{name:'Pulizia Sistemi',kind:'support',help:'Rimuove Ionico e Corrosione dalla propria madre, non ripara HP'},
 'support-escort-repair':{name:'Riparazione Scudiera',kind:'support',help:'Ripara fino a 15 HP su una scudiera operativa, senza rianimarla'},
 ...Object.fromEntries(Object.values(TACTICAL_EPIC_CARDS).map(epic=>[epic.id,{name:epic.name,kind:'epic',help:epic.help}]))
});
// The twelve-card-family prototype starter is preserved for old tests and
// existing snapshots; new loadout presets are opt-in and still use 24 cards.
const TACTICAL_STARTER_FAMILIES=Object.freeze([
 'tactic-power-shift','tactic-scan','tactic-suppress','fusion-barrier',
 'tactic-counter','tactic-reactive','tactic-kinetic','tactic-impact',
 'support-shield-repair','shot-piercing','shot-ion','tactic-numeric-recycle'
]);
export const TACTICAL_STARTER_TYPES=Object.freeze(TACTICAL_STARTER_FAMILIES.flatMap(type=>[type,type]));
export const TACTICAL_SPECIAL_DECK_SIZE=24;
export const TACTICAL_SPECIAL_COPY_LIMIT=6;
export function validateTacticalLoadout(types){
 if(!Array.isArray(types)||types.length!==TACTICAL_SPECIAL_DECK_SIZE)return false;
 const counts={};let epics=0;
 for(const type of types){
  if(!Object.hasOwn(TACTICAL_SPECIALS,type))return false;
  counts[type]=(counts[type]||0)+1;
  if(counts[type]>TACTICAL_SPECIAL_COPY_LIMIT)return false;
  if(isTacticalEpic(type)){
   epics++;
   if(counts[type]>1||epics>2)return false;
  }
 }
 return true;
}
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
// Compatibilità esterna con il prototipo iniziale. Le 17 firme vive sono ora
// selezionate attraverso tacticalShipSignatures(shipId), mai condivise.
export const TACTICAL_SIGNATURES=tacticalShipSignatures('C01');
const clone=o=>structuredClone(o);
const positive=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
const other=side=>side==='A'?'B':'A';
const seedRandom=seed=>{let x=seed>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}};
const shuffle=(array,rand)=>{const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function numericPile(key,seed,shuffleOpening=false){
 const start=NUMERIC_STARTS[key];
 const all=CARD_SUITS.flatMap(suit=>Array.from({length:13},(_,i)=>({
   id:key+'-n-'+suit+'-'+(i+1),suit,value:i+1
 })));
 // Le partite ufficiali pescano realmente 7 carte dal mazzo da 52.
 // I fixture deterministici storici conservano la loro apertura solo nei test.
 if(shuffleOpening){
  const shuffled=shuffle(all,seedRandom(seed));
  return {hand:shuffled.slice(0,7),deck:shuffled.slice(7),discard:[]};
 }
 const hand=start.map(([value,suit])=>all.find(c=>c.value===value&&c.suit===suit));
 const ids=new Set(hand.map(c=>c.id));
 return {hand,deck:shuffle(all.filter(c=>!ids.has(c.id)),seedRandom(seed)),discard:[]};
}
function specialPile(key,seed,loadout=null,epicOpening=null){
 const types=loadout??TACTICAL_STARTER_TYPES;
 if(!validateTacticalLoadout(types))throw new Error('Mazzo tattico non valido: 24 carte, massimo 6 copie');
 const cards=types.map((type,i)=>({id:key+'-s-'+i,type}));
 const used=new Set();
 // The baseline duel retains its original demonstrative opening hands.
 // All other decks draw five real instances from the 24-card list.
 const opening=loadout?shuffle(cards,seedRandom(seed+59)).slice(0,5):
  SPECIAL_STARTS[key].map(type=>{
   const card=cards.find(c=>c.type===type&&!used.has(c.id));used.add(card.id);return card;
  });
 if(epicOpening){
  const card=cards.find(c=>c.type===epicOpening);
  if(!card||!isTacticalEpic(epicOpening))throw new Error('Anteprima Epica mancante dal mazzo');
  if(!opening.some(c=>c.id===card.id))opening[0]=card;
 }
 for(const card of opening)used.add(card.id);
 return {hand:opening,deck:shuffle(cards.filter(c=>!used.has(c.id)),seedRandom(seed)),discard:[]};
}
function nativeWeapons(shipId,level){
 return NATIVE_GUNS.filter(w=>w.nave_id===shipId).map(w=>({
   id:w.id,name:w.nome,kind:w.tipo,visual:w.effetto_visivo,
   damage:w.danno_colpo_L1+Math.floor((w.danno_colpo_L5-w.danno_colpo_L1)*(level-1)/4)
 }));
}
export function nativeBarrierPacket(side){return tacticalBarrierPower(side).amount;}
function createSide(key,shipId,level,seed,specialDeck=null,bossPlanetId=null,epicEntitlements=[],epicOpening=null,shuffleOpening=false,commander=null,bossNumericDeck=null){
 const ship=SHIPS.find(x=>x.id===shipId);
 if(!ship||!Number.isInteger(level)||level<1||level>5)throw new Error('Navicella o livello non valido');
 if(!Array.isArray(epicEntitlements)||epicEntitlements.some(id=>!isTacticalEpic(id)))
  throw new Error('Inventario Epico non valido');
 if(epicOpening&&!epicEntitlements.includes(epicOpening))throw new Error('Anteprima Epica non autorizzata');
 if((specialDeck||[]).some(type=>isTacticalEpic(type)&&!epicEntitlements.includes(type)))
  throw new Error('Oggetto Epico non ancora ottenuto dalla fusione delle reliquie');
 const defense=createMotherDefense({shipId,shieldMax:60,partHp:10,signatures:tacticalShipSignatures(shipId)});
 const escortCount=level>=5?2:level>=3?1:0;
 return equipTacticalBossDeck({key,shipId,name:ship.nome,level,weapons:nativeWeapons(shipId,level),defense,
  escorts:Array.from({length:escortCount},(_,i)=>({id:key+'-escort-'+i,hp:20,max:20})),
  sync:0,ionized:false,corroded:false,heated:false,bossPlanetId,
  bossExclusive:createExclusiveBossState(bossPlanetId),seen:[],
  commander:commander&&tacticalCommanderReady(commander.id)?{
   id:commander.id,level:Math.max(1,Math.min(5,Math.floor(Number(commander.level)||1))),bonusRemainder:0
  }:null,
  epic:{active:null,used:[],entitlements:[...epicEntitlements],peek:[],exchangeCredits:0,
   exchangeUntilRound:0,dustPreview:0},
  numeric:numericPile(key,seed+3,shuffleOpening),special:specialPile(key,seed+13,specialDeck,epicOpening)},bossNumericDeck);
}
export function createTacticalDuel({shipA='C01',shipB='R04',levelA=3,levelB=3,seed=18,nowMs=0,arenaId='titanium',
 specialDeckA=null,specialDeckB=null,bossPlanetB=null,epicEntitlementsA=[],epicEntitlementsB=[],previewEpicOpeningA=null,shuffleNumericOpening=false,commanderA=null,commanderB=null,bossNumericDeckA=null}={}){
 if(!Number.isFinite(nowMs))throw new Error('Orologio non valido');
 return {schemaVersion:1,arenaId,arenaValidCalculations:0,phase:'planning',round:1,deadlineMs:nowMs+TACTICAL_TIMING.prepareMs,
  resolveUntilMs:null,orders:{A:null,B:null},winner:null,
  sides:{A:createSide('A',shipA,levelA,seed,specialDeckA,null,epicEntitlementsA,previewEpicOpeningA,shuffleNumericOpening,commanderA,bossNumericDeckA),
   B:createSide('B',shipB,levelB,seed+43,specialDeckB,bossPlanetB,epicEntitlementsB,null,shuffleNumericOpening,commanderB)},
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
 if(ni.length>0&&(!VITAL_IDS.includes(order.vitalId)||!['plus','minus','times','divide','pair','trips'].includes(order.op)))return {ok:false,reason:'invalid_precision'};
 // Anti-stall: one free replacement without a precision attack.
 // Pendulum grants ONE additional replacement on the cycle after real damage.
 const freePendulum=side.epic.exchangeUntilRound===battle.round?side.epic.exchangeCredits:0;
 const allowedFree=(ni.length===0?1:0)+freePendulum;
 if(!types.includes('tactic-numeric-recycle')&&ei.length>allowedFree)
  return {ok:false,reason:'recycle_requires_card'};
 if(order.weaponFocusId!=null&&!side.weapons.some(w=>w.id===order.weaponFocusId))
  return {ok:false,reason:'weapon_focus_invalid'};
 if(ni.some(i=>ei.includes(i)))return {ok:false,reason:'card_double_spend'};
 const epics=types.filter(isTacticalEpic);
 if(epics.length>1)return {ok:false,reason:'epic_conflict'};
 if(epics.length){
  const id=epics[0],profile=TACTICAL_EPIC_CARDS[id];
  if(!side.epic.entitlements.includes(id))return {ok:false,reason:'epic_locked'};
  if(side.epic.used.includes(id))return {ok:false,reason:'epic_already_used'};
  if(side.epic.active&&side.epic.active.untilRound>=battle.round)
   return {ok:false,reason:'epic_already_active'};
  if(['epic_item_1','epic_item_9'].includes(id)&&!tacticalEpicCritical(side))
   return {ok:false,reason:'epic_not_critical'};
  if(id==='epic_item_9'&&!side.weapons.some(w=>w.kind==='Accumulo'))
   return {ok:false,reason:'epic_requires_heavy'};
  // Möbius/Astrolabio reveal cards ON activation; selection happens later.
  if(order.epicChoice!=null)return {ok:false,reason:'epic_choice_not_ready'};
 }else if(order.epicChoice!=null){
  const active=side.epic.active;
  if(!active||active.untilRound<battle.round||active.startedRound>=battle.round||
    !['epic_item_1','epic_item_3'].includes(active.id)||
    !Number.isInteger(order.epicChoice)||order.epicChoice<0||
    order.epicChoice>=(active.id==='epic_item_1'?10:2))
    return {ok:false,reason:'epic_choice_invalid'};
 }
 const fusionTypes=types.filter(type=>type.startsWith('fusion-'));
 if(fusionTypes.length>1)return {ok:false,reason:'fusion_conflict'};
 if(fusionTypes.length){
  const requiresTwo=fusionTypes.includes('fusion-twin')||fusionTypes.includes('fusion-triad');
  const needed=requiresTwo?2:1;
  if(side.escorts.filter(e=>e.hp>0).length<needed||side.sync<100||
    side.defense.parts.command.hp<=0||side.defense.parts.engine.hp<=0)
    return {ok:false,reason:'fusion_unavailable'};
 }
 if(types.includes('tactical-cover')&&(!side.escorts.some(e=>e.hp>0)||side.defense.parts.command.hp<=0))
  return {ok:false,reason:'cover_unavailable'};
 if(types.includes('support-escort-repair')&&(!side.escorts.some(e=>e.hp>0&&e.hp<e.max)||
   side.defense.parts.command.hp<=0))return {ok:false,reason:'escort_repair_unavailable'};
 if(types.includes('support-status-purge')&&
   !(side.ionized||side.corroded||side.heated))return {ok:false,reason:'purge_unavailable'};
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
  counterVitalId:order.counterVitalId??null,exchangeIndices:[...(order.exchangeIndices??[])],
  weaponFocusId:order.weaponFocusId??null,epicChoice:order.epicChoice??null
 };
 const next={...battle,orders:{...battle.orders,[key]:normalized}};
 return {ok:true,battle:next};
}
function recyclePile(pile,indices,size,random,firstDrawChoice=0){
 const spent=indices.map(i=>pile.hand[i]);
 const keep=pile.hand.filter((_,i)=>!indices.includes(i));
 let deck=[...pile.deck],discard=[...pile.discard,...spent],hand=[...keep];
 let draws=0;
 while(hand.length<size){
  if(!deck.length){if(!discard.length)break;deck=shuffle(discard,random);discard=[];}
  const pos=draws===0&&firstDrawChoice===1&&deck.length>=2?1:0;
  hand.push(deck.splice(pos,1)[0]);
  draws++;
 }
 return {hand,deck,discard};
}
function specialTypes(side,order){return order.specialIndices.map(i=>side.special.hand[i].type);}
function applyPreparation(sides,orders,log,round){
 const status={};
 for(const key of ['A','B']){
  const side=sides[key],types=specialTypes(side,orders[key]);
  expireTacticalEpic(side,round);
  prepareTacticalEpicChoice(side,round,orders[key].epicChoice,log);
  const playedEpic=types.find(isTacticalEpic);
  if(playedEpic)activateTacticalEpic(side,playedEpic,round,0,log);
  const fusion=types.find(type=>type.startsWith('fusion-'))??null;
  const active={types,bossSnapshot:tacticalBossConditionSnapshot(side),
   newCounter:types.includes('tactic-counter')?orders[key].counterVitalId:null,
   suppressFirstEscort:types.includes('tactic-suppress'),
   fusion,fusionDefense:({'fusion-barrier':.60,'fusion-twin':.55,'fusion-triad':.40})[fusion]||0,
   fusionAssault:({'fusion-strike':.25,'fusion-triad':.35})[fusion]||0,
   cover:types.includes('tactical-cover'),coverUsed:false,
   piercing:types.includes('shot-piercing'),ionizedDefense:!!side.ionized,
   weaponFocusId:focusedTacticalTechnology(side,orders[key].weaponFocusId)?.weaponId??null,
   tech:focusedTacticalTechnology(side,orders[key].weaponFocusId)?.technology??null,
   epicId:side.epic.active?.id??null};
  if(types.includes('support-shield-repair')){
   const fixed=restoreMotherShield(side.defense,20);
   side.defense=fixed.defense;
   log.push(key+': barriera riparata +'+fixed.repaired);
  }
  if(types.includes('support-escort-repair')){
   const escort=side.escorts.find(e=>e.hp>0&&e.hp<e.max);
   const fixed=escort?Math.min(15,escort.max-escort.hp):0;
   if(escort)escort.hp+=fixed;
   log.push(key+': scudiera riparata +'+fixed);
  }
  if(types.includes('support-status-purge')){
   side.ionized=false;side.corroded=false;side.heated=false;
   active.ionizedDefense=false;
   log.push(key+': ionizzazione, corrosione e calore rimossi');
  }
  if(types.includes('tactic-scan')){
   const next=VITAL_IDS.filter(id=>!side.seen.includes(id)).slice(0,2);
   side.seen=[...side.seen,...next];
   log.push(key+': scansione, firme rivelate: '+next.join(', '));
  }
  if(active.fusion){side.sync-=100;log.push(key+': '+TACTICAL_SPECIALS[active.fusion].name+' con scudiere reali, costo 100 Sincronia');}
  log.push(key+': fuoco concentrato su '+(side.weapons.find(w=>w.id===active.weaponFocusId)?.name??'nessuna arma')+
   ' · '+(active.tech??'n/d'));
  status[key]=active;
 }
 return status;
}
function applyBarrierAttack(sides,key,orders,status,log,impacts,modifiers){
 const atk=sides[key],def=sides[other(key)],t=status[key],res=status[other(key)];
 const base=nativeBarrierPacket(atk);
 const exclusiveNative=exclusiveBossNativeBonus(atk,base);
 const pilot=tacticalCommanderVolleyBonus(atk,def,orders[key],base);
 if(pilot.active){
  atk.commander={...atk.commander,bonusRemainder:pilot.remainder};
  log.push(key+': '+pilot.pilotId+' · calcolo '+orders[key].op+
   ' valido, bonus pilota '+pilot.percentage+'% ('+pilot.extra+' HP, resto '+pilot.remainder+'/100)');
 }
 // Every bonus modifies the REAL native weapon packet; two different special
 // cards never exceed the established +45% offensive cap.
 const bonus=(t.types.includes('tactic-power-shift')?6:0)+
  (t.types.includes('tactic-kinetic')?6:0)+
  Math.floor(base*t.fusionAssault)+
  (t.tech==='laser'&&!def.escorts.some(e=>e.hp>0)?2:0)+
  (def.corroded?Math.floor(base*.25):0)+
  (def.heated?3:0)+exclusiveNative.extra;
 // Il pilota è un modificatore dell'armamento originale, distinto dal
 // tetto +45% delle carte speciali: nessuna munizione extra.
 let total=base+Math.min(Math.floor(base*.45),bonus)+pilot.extra;
 if(res.types.includes('tactic-power-shift'))total+=3;
 const ombre=tacticalBossOutgoingBonus(atk,total,{snapshot:t.bossSnapshot});
 total+=ombre.extra;
 // Precisione criogenica: formula di divisione verificata sul bersaglio.
 const idra=tacticalIdraBonus(atk,def,orders[key],total);
 total+=idra.extra;
 const before=total;
 if(res.types.includes('tactic-reactive'))total=Math.max(0,total-9);
 if(res.types.includes('tactic-impact'))total=Math.floor(total*.8);
 let intercepted=0,splash=0;
 // Kinetic and the real Piercing card bypass ESCORT interception, never mother
 // shields nor numeric vital signatures.
 const bypass=(t.piercing?.20:0)+(t.tech==='cinetico'?.10:0);
 const escortPacket=total-Math.floor(total*Math.min(.35,bypass));
 // The command module coordinates all escort interception. At <=50% HP,
 // each real escort absorbs 15% less, including cover and fusion. At KO,
 // no interception takes place and no escort HP is spent.
 const escortEfficiency=escortInterceptionEfficiency(def.defense);
 if(escortEfficiency>0){
  const live=def.escorts.filter(e=>e.hp>0);
  const maxIntercept=Math.min(escortPacket,Math.floor(total*.75*escortEfficiency));
  if(res.cover&&live.length&&def.defense.shield.hp>0){
   const take=Math.min(live[0].hp,Math.floor(total*.75*escortEfficiency),maxIntercept);
   live[0].hp-=take;intercepted+=take;res.coverUsed=take>0;
  }
  let suppressed=false;
  const supported=live.filter(e=>e.hp>0).length;
  for(const e of def.escorts){
   if(e.hp<=0)continue;
   if(t.suppressFirstEscort&&!suppressed){suppressed=true;continue;}
   const share=res.fusionDefense?(res.fusion==='fusion-twin'||res.fusion==='fusion-triad'
     ?res.fusionDefense/Math.max(1,supported):res.fusionDefense)
     :(res.ionizedDefense?.10:.20);
   const nerfed=res.ionizedDefense&&res.fusionDefense?share*.5:share;
   const take=Math.max(0,Math.min(e.hp,Math.floor(escortPacket*nerfed*escortEfficiency),maxIntercept-intercepted));
   e.hp-=take;intercepted+=take;
   if(res.fusion==='fusion-barrier'||res.fusion==='fusion-strike')break;
  }
  // Explosive native technology spreads a small real HP impact to a second
  // active escort; it never injures a protected vital.
  if(t.tech==='esplosivo'&&def.escorts.length>1&&def.escorts[1].hp>0){
   splash=Math.min(2,def.escorts[1].hp);def.escorts[1].hp-=splash;
  }
 }
 if(intercepted>0&&escortEfficiency<1)
  log.push(other(key)+': Centralina danneggiata, intercettazione scudiere −15%');
 // L'ambiente protegge solo la barriera madre, dopo le scudiere reali.
 const motherPacket=Math.max(0,total-intercepted);
 const bossDefenseFactor=tacticalBossMotherFactor(def);
 const exclusiveDefenseFactor=exclusiveBossShieldFactor(def);
 const effectivePacket=Math.floor(Math.floor(motherPacket*bossDefenseFactor*exclusiveDefenseFactor)*(modifiers?.shieldDamageFactor||1));
 const hit=damageMotherShield(def.defense,effectivePacket);
 def.defense=hit.defense;
 rememberTacticalBossMotherHit(def,hit.damage);
 rememberExclusiveBossDefenseHit(def,hit.damage);
 rememberExclusiveBossNativeHit(atk,hit.damage,exclusiveNative);
 if(hit.damage>0&&exclusiveDefenseFactor<1)
  log.push(other(key)+': Gaia · Corazza tellurica consumata (−20% primo impatto alla barriera)');
 if(hit.damage>0&&exclusiveNative.active)
  log.push(key+': Tharsis · Assalto progressivo +'+exclusiveNative.percentage+
   '% sulla salva nativa (bonus '+exclusiveNative.extra+', resto '+exclusiveNative.remainder+'/100)');
 rememberTacticalBossOutgoingHit(atk,hit.damage,ombre);
 rememberTacticalIdraHit(atk,hit.damage,idra);
 if(idra.active&&hit.damage>0)
  log.push(key+': Idra · '+idra.abilities.join(' + ')+' ('+
   idra.percentage+'%, +'+idra.extra+' HP, resto '+idra.remainder+'/100)');
 if(ombre.active&&hit.damage>0)
  log.push(key+': Ombre · '+ombre.abilities.join(' + ')+' ('+
   ombre.percentage+'%, +'+ombre.extra+' HP, resto '+ombre.remainder+'/100)');
 if(hit.damage>0&&bossDefenseFactor<1)
  log.push(other(key)+': Primo anello · primo impatto alla madre ridotto del '+Math.round((1-bossDefenseFactor)*100)+'%');
 impacts.push({kind:'barrier',by:key,target:other(key),packet:before,intercepted,splash,
  technology:t.tech,damage:hit.damage,weaponIds:atk.weapons.map(w=>w.id),
  pilotBonus:pilot.extra,pilotId:pilot.active?pilot.pilotId:null});
 log.push(key+': armi native '+atk.weapons.map(w=>w.name).join(' + ')+
  ' ('+before+' potenziali, '+intercepted+' intercettati), barriera '+hit.damage);
 return hit.damage;
}
function applyVitalAttack(sides,key,order,status,log,impacts,round,modifiers){
 const atk=sides[key],def=sides[other(key)];
 if(!order.numericIndices.length)return 0;
 const cards=order.numericIndices.map(i=>atk.numeric.hand[i]);
 const target=order.vitalId;
 let defense=def.defense;
 const signature=defense.parts[target].signature;
 const matches=tacticalSignatureMatches(signature,order.op,cards);
 if(!matches){
  impacts.push({kind:'precision',by:key,target,damage:0,reason:'invalid_signature'});
  log.push(key+': combinazione non valida per '+target+' — numeriche consumate');
  return 0;
 }
 if(!defense.parts[target].exposed&&remainingExposureSlots(defense)>0)
   defense=exposeMotherPart(defense,target).defense;
 if(!defense.parts[target].exposed){
  impacts.push({kind:'precision',by:key,target,damage:0,reason:'protected'});
  log.push(key+': '+target+' ancora protetto dalla barriera');return 0;
 }
 if(status[other(key)].newCounter===target){
  impacts.push({kind:'precision',by:key,target,damage:0,reason:'countered'});
  log.push(key+': attacco a '+target+' respinto da Contromisura programmata');
  return 0;
 }
 let damage=10+tacticalEpicMatriceDamage(atk,round,order.op),absorbed=0;
 // Bonus Plasma esclusivamente su tre numeriche e firma autentica valida.
 if(cards.length===3&&modifiers?.tripleAttackFactor)
  damage=Math.max(1,Math.round(damage*modifiers.tripleAttackFactor));
 // Pressione marziana: bonus solo con un precedente colpo efficace allo stesso
 // vitale. La protezione della nave avversaria puo ancora assorbirlo.
 const tharsis=tacticalBossVitalBonus(atk,target,damage);
 damage+=tharsis.extra;
 const ombre=tacticalBossOutgoingBonus(atk,damage,{vitalId:target,
  snapshot:status[key].bossSnapshot});
 damage+=ombre.extra;
 const idra=tacticalIdraBonus(atk,def,order,damage,{vitalId:target});
 damage+=idra.extra;
 // Riciclo numerico e tripla autentica modificano SOLO il colpo di
 // precisione, mai le armi native che sparano senza carte numeriche.
 const leviatano=tacticalLeviatanoBonus(atk,def,order,damage);
 damage+=leviatano.extra;
 const defenseStatus=status[other(key)];
 const escortEfficiency=escortInterceptionEfficiency(def.defense);
 if(escortEfficiency>0){
  const protector=def.escorts.find(e=>e.hp>0);
  if(protector&&defenseStatus.cover&&!defenseStatus.coverUsed){
   const take=Math.min(protector.hp,Math.floor(damage*.75*escortEfficiency));
   protector.hp-=take;damage-=take;absorbed+=take;
   defenseStatus.coverUsed=take>0;
   log.push(other(key)+': copertura tattica assorbe '+take+' HP reali');
  }
  if(damage>0&&defenseStatus.fusionDefense&&defenseStatus.fusion){
   const defenders=def.escorts.filter(e=>e.hp>0);
   const maxTake=Math.floor(damage*defenseStatus.fusionDefense*escortEfficiency);
   let remaining=maxTake;
   for(const protector of defenders){
    const take=Math.min(protector.hp,remaining);
    protector.hp-=take;remaining-=take;damage-=take;absorbed+=take;
    if(defenseStatus.fusion==='fusion-barrier'||defenseStatus.fusion==='fusion-strike'||remaining<=0)break;
   }
   if(maxTake-remaining>0)log.push(other(key)+': fusione assorbe '+(maxTake-remaining)+' HP reali');
  }
 }
 const bossDefenseFactor=tacticalBossMotherFactor(def);
 damage=Math.floor(damage*bossDefenseFactor);
 const hit=hitMotherPart(defense,target,damage,cards);
 const consequence=hit.damage>0?tacticalVitalTransition(defense,hit.defense,target):null;
 def.defense=hit.defense;
 rememberTacticalBossMotherHit(def,hit.damage);
 rememberTacticalBossVitalHit(atk,target,hit.damage,tharsis);
 rememberTacticalBossOutgoingHit(atk,hit.damage,ombre);
 rememberTacticalIdraHit(atk,hit.damage,idra,{vitalId:target});
 rememberTacticalLeviatanoHit(atk,hit.damage,leviatano);
 if(leviatano.active&&hit.damage>0)
  log.push(key+': Leviatano · '+leviatano.abilities.join(' + ')+' ('+
   leviatano.percentage+'%, +'+leviatano.extra+' HP, resto '+leviatano.remainder+'/100)');
 if(idra.active&&hit.damage>0)
  log.push(key+': Idra · '+idra.abilities.join(' + ')+' ('+
   idra.percentage+'%, +'+idra.extra+' HP, resto '+idra.remainder+'/100)');
 if(ombre.active&&hit.damage>0)
  log.push(key+': Ombre · '+ombre.abilities.join(' + ')+' ('+
   ombre.percentage+'%, +'+ombre.extra+' HP, resto '+ombre.remainder+'/100)');
 if(tharsis.active&&hit.damage>0)
  log.push(key+': Pressione marziana '+tharsis.percentage+'%, bonus '+
   tharsis.extra+' HP (resto '+tharsis.remainder+'/100)');
 if(hit.damage>0&&bossDefenseFactor<1)
  log.push(other(key)+': Primo anello · primo colpo vitale ridotto del '+Math.round((1-bossDefenseFactor)*100)+'%');
 impacts.push({kind:'precision',by:key,target,damage:hit.damage||0,absorbed,reason:hit.reason,destroyed:!!hit.destroyed});
 if(target==='shieldGenerator'&&hit.destroyed){
  // La barriera madre collassa quando il suo vero generatore va KO.
  def.defense=damageMotherShield(def.defense,def.defense.shield.hp).defense;
  log.push(other(key)+': generatore KO, barriera collassata e riparazioni impossibili');
 }
 log.push(key+': '+target+' '+(hit.reason==='hit'?'-'+hit.damage+' HP'+(hit.destroyed?' [KO]':''):'nessun danno: '+hit.reason));
 if(consequence)log.push(other(key)+': '+consequence.label);
 return hit.damage||0;
}
// Only public combat condition snapshots, never hands/deck or hidden orders.
function combatSnapshot(sides){return Object.fromEntries(['A','B'].map(key=>[key,{
  defense:clone(sides[key].defense),escorts:clone(sides[key].escorts)
}]));}
function winState(sides){
 const a=motherDestroyed(sides.A.defense),b=motherDestroyed(sides.B.defense);
 return a&&b?'draw':a?'B':b?'A':null;
}
function resolveCycle(battle,nowMs){
 const sides=clone(battle.sides),orders=clone(battle.orders);
 const before=combatSnapshot(sides),impacts=[];
 const environmentStage=arenaEnvironment(battle.arenaId,battle.arenaValidCalculations+1).stage;
 const modifiers=arenaPhaseModifiers(battle.arenaId,environmentStage);
 const playedSpecials=Object.fromEntries(['A','B'].map(key=>[key,
  orders[key].specialIndices.map(i=>sides[key].special.hand[i].type)]));
 const log=['Scontro '+battle.round+' — ordini rivelati simultaneamente'];
 const status=applyPreparation(sides,orders,log,battle.round);
 const prepared=combatSnapshot(sides);
 const a=applyBarrierAttack(sides,'A',orders,status,log,impacts,modifiers);
 const b=applyBarrierAttack(sides,'B',orders,status,log,impacts,modifiers);
 const afterBarrier=combatSnapshot(sides);
 const hitsA=applyVitalAttack(sides,'A',orders.A,status,log,impacts,battle.round,modifiers);
 const hitsB=applyVitalAttack(sides,'B',orders.B,status,log,impacts,battle.round,modifiers);
 const afterPrecision=combatSnapshot(sides);
 const validCalculation={};
 for(const key of ['A','B']){
  const order=orders[key],atk=sides[key],def=sides[key==='A'?'B':'A'];
  validCalculation[key]=order.numericIndices.length>=2&&
   tacticalSignatureMatches(def.defense.parts[order.vitalId]?.signature,
    order.op,order.numericIndices.map(i=>atk.numeric.hand[i]));
 }
 for(const key of ['A','B']){
  const side=sides[key],order=orders[key];
  const random=seedRandom((battle.round*997+ (key==='A'?199:311))>>>0);
  side.special=recyclePile(side.special,order.specialIndices,5,random);
  const previousNumerics=side.numeric;
  const spentNumerics=[...order.numericIndices,...order.exchangeIndices];
  side.numeric=recyclePile(previousNumerics,spentNumerics,7,random,
   tacticalEpicNumericChoice(side,battle.round));
  rememberTacticalLeviatanoRecycle(side,previousNumerics,spentNumerics.length);
  side.sync=Math.min(100,side.sync+25+((key==='A'?hitsA:hitsB)>0?25:0)+
   (validCalculation[key]?modifiers.syncPerCalculation:0));
  if(side.epic.exchangeUntilRound===battle.round){
   side.epic.exchangeCredits=0;side.epic.exchangeUntilRound=0;
  }
  // Persistent status is ONE following cycle only, and requires a real barrier hit.
  const enemyKey=other(key);
  const enemyShieldDamage=enemyKey==='A'?a:b;
  const enemyStatus=status[enemyKey];
  side.ionized=enemyShieldDamage>0&&
   (enemyStatus.types.includes('shot-ion')||enemyStatus.tech==='ionico');
  side.corroded=enemyShieldDamage>0&&enemyStatus.types.includes('shot-corrosion');
  side.heated=enemyShieldDamage>0&&enemyStatus.tech==='plasma'&&
   !tacticalEpicProtectsFromHeat(side,battle.round);
 }
 resolveTacticalEpicAfterCombat(sides,battle.round,impacts,log);
 let winner=winState(sides);
 if(battle.round>=TACTICAL_TIMING.maxRounds&&!winner)winner='draw';
 log.push('Barriere: A '+sides.A.defense.shield.hp+'/60; B '+sides.B.defense.shield.hp+'/60');
 if(winner)log.push(winner==='draw'?'Pareggio: limite/doppio KO':'Vince '+winner);
 return {...battle,sides,phase:'resolving',resolveUntilMs:nowMs+TACTICAL_TIMING.resolveMs,
  arenaValidCalculations:battle.arenaValidCalculations+Number(validCalculation.A)+Number(validCalculation.B),
  orders,history:[...battle.history,{round:battle.round,orders,events:log,shieldA:a,shieldB:b,hitsA,hitsB,
   snapshots:{before,prepared,afterBarrier,afterPrecision},impacts,playedSpecials,
   environmentStage}],lastEvents:log,winner};
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
