// Eclissi Stellare: motore deterministico del duello tattico simultaneo ufficiale.
// Usato nella plancia 3D della campagna standard; i premi vengono assegnati dal controller, non dal motore.
// Gli armamenti sono i 42 del catalogo esistente: i calcoli non alimentano lo scudo.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createExclusiveBossState,exclusiveBossShieldFactor,rememberExclusiveBossDefenseHit,
 exclusiveBossNativeBonus,rememberExclusiveBossNativeHit,
 rememberExclusiveVenusPrecisionHit,exclusiveNeurotoxinActive,
 exclusiveNeurotoxinRepairAmount,clearExclusiveNeurotoxin,expireExclusiveNeurotoxin,
 rememberExclusiveChronoCounter,exclusiveChronoNativeBonus,
 rememberExclusiveChronoNativeHit,transferExclusiveIonicSync,
 exclusiveLeviatanoNativeBonus,rememberExclusiveLeviatanoNativeHit,
 prepareExclusiveBloodPact,exclusiveBloodPactNativeBonus,
 prepareExclusiveIdraRegen,rememberExclusiveIdraBarrierHit,cancelExclusiveIdraByHeart,
 exclusiveChaosNativeBonus,rememberExclusiveChaosNativeHit,
 rememberExclusiveResonanceDiscards,collectExclusiveResonanceSync,
 exclusiveMagmaPhase,exclusiveMagmaNativeAdjustment,
 exclusiveVoidDominantSuit,exclusiveVoidPrecisionBonus,rememberExclusiveVoidCounter
} from './tacticalExclusiveBosses.js';
import {arenaPhaseModifiers,arenaEnvironment} from './battleArenas.js';
import {tacticalShipSignatures,tacticalSignatureMatches} from './tacticalShipSignatures.js';
import {tacticalCommanderReady,tacticalCommanderVolleyBonus} from './tacticalCommanders.js';
import {equipTacticalBossDeck,tacticalBossMotherFactor,rememberTacticalBossMotherHit,
 tacticalBossVitalBonus,rememberTacticalBossVitalHit,tacticalBossConditionSnapshot,
 tacticalBossOutgoingBonus,rememberTacticalBossOutgoingHit,
 tacticalIdraBonus,rememberTacticalIdraHit,
 tacticalLeviatanoBonus,rememberTacticalLeviatanoHit,
 rememberTacticalLeviatanoRecycle,
 tacticalMagmaNativeBonus,rememberTacticalMagmaBarrierHit,
 tacticalMagmaVitalBonus,rememberTacticalMagmaVitalHit,
 tacticalSovereignSupremacyBonus,rememberTacticalSovereignHit,
 tacticalGeneratorSyncBonus,tacticalResonanceNativeBonus,rememberTacticalResonanceNativeHit,
 tacticalResonanceVitalBonus,rememberTacticalResonanceVitalHit,
 tacticalAfroditeRepairAmount,tacticalAfroditeRecycleCooldownMs,
 tacticalResonanceCooperationBonus,rememberTacticalResonanceCooperationHit} from './tacticalBossDecks.js';
import {tacticalBarrierPower,focusedTacticalTechnology} from './tacticalArmamentBalance.js';
import {escortInterceptionEfficiency} from './fleetSystems.js';
import {tacticalBossCommanderAttackBonus,tacticalBossCommanderDefenseBonus,rememberTacticalBossCommanderImpact} from './tacticalBossCommanderBridge.js';
import {createTacticalEscortArmament,selectTacticalEscortForAmmo,prepareTacticalEscortVolley} from './tacticalEscortVolley.js';
import {tacticalCombatClock,tacticalStatusActive,applyTacticalTimedStatus,clearTacticalTimedStatuses} from './tacticalTimedStatus.js';
import {BOSS_CHARACTER_CATALOG,isBossCharacterCard,bossCharacterActive,activateBossCharacter,expireBossCharacter,bossCharacterNativeBonus,bossCharacterShieldFactor,bossCharacterIonFactor,bossCharacterPrecisionExtra,bossCharacterEscortExtra,bossCharacterSyncExtra,bossCharacterCounterSync,bossCharacterRememberHit,bossCharacterApplyRegen} from './bossCharacterCards.js';
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
 ...Object.fromEntries(Object.values(TACTICAL_EPIC_CARDS).map(epic=>[epic.id,{name:epic.name,kind:'epic',help:epic.help}])),
 ...Object.fromEntries(Object.values(BOSS_CHARACTER_CATALOG).map(c=>[c.id,
  {name:c.name,kind:'boss-character',help:c.description,characterId:c.id}]))
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
  if(counts[type]>(isBossCharacterCard(type)?1:TACTICAL_SPECIAL_COPY_LIMIT))return false;
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
 const weapons=nativeWeapons(shipId,level);
 return equipTacticalBossDeck({key,shipId,name:ship.nome,level,weapons,defense,
  escorts:Array.from({length:escortCount},(_,i)=>({
   id:key+'-escort-'+i,hp:20,max:20,slot:i,
   weapon:createTacticalEscortArmament(shipId,weapons,i)
  })),
  sync:0,ionized:false,corroded:false,heated:false,bossCharacter:null,bossPlanetId,
  neurotoxinUntilRound:0,bossExclusive:createExclusiveBossState(bossPlanetId),seen:[],
  commander:commander&&tacticalCommanderReady(commander.id)?{
   id:commander.id,level:Math.max(1,Math.min(5,Math.floor(Number(commander.level)||1))),bonusRemainder:0
  }:null,
  epic:{active:null,used:[],entitlements:[...epicEntitlements],peek:[],exchangeCredits:0,
   exchangeUntilRound:0,dustPreview:0},
  numeric:numericPile(key,seed+3,shuffleOpening),special:specialPile(key,seed+13,specialDeck,epicOpening)},bossNumericDeck);
}
export function createTacticalDuel({shipA='C01',shipB='R04',levelA=3,levelB=3,seed=18,nowMs=0,arenaId='titanium',
 specialDeckA=null,specialDeckB=null,bossPlanetB=null,epicEntitlementsA=[],epicEntitlementsB=[],previewEpicOpeningA=null,shuffleNumericOpening=false,commanderA=null,commanderB=null,bossNumericDeckA=null,bossNumericDeckB=null}={}){
 if(!Number.isFinite(nowMs))throw new Error('Orologio non valido');
 const battle={schemaVersion:1,arenaId,arenaValidCalculations:0,phase:'planning',round:1,deadlineMs:nowMs+TACTICAL_TIMING.prepareMs,
  resolveUntilMs:null,orders:{A:null,B:null},winner:null,
  sides:{A:createSide('A',shipA,levelA,seed,specialDeckA,null,epicEntitlementsA,previewEpicOpeningA,shuffleNumericOpening,commanderA,bossNumericDeckA),
   B:createSide('B',shipB,levelB,seed+43,specialDeckB,bossPlanetB,epicEntitlementsB,null,shuffleNumericOpening,commanderB,bossNumericDeckB)},
  history:[],lastEvents:bossPlanetB===20?[
   'B: Sovrano del Vuoto · seme dominante '+exclusiveVoidDominantSuit(1)+
   ' (cicli 1–3, rotazione ogni 3 cicli)'
  ]:bossPlanetB===19?[
   'B: Nucleo Magmatico · fase CARICA per il ciclo 1 (rotazione ogni 3 cicli)'
  ]:[]};
 // This does not create any cards: it merely schedules the first legitimate
 // Afrodite numeric exchange after the real opening cooldown.
 for(const side of Object.values(battle.sides)){
  const cooldown=tacticalAfroditeRecycleCooldownMs(side);
  if(cooldown)side.numericExchangeReadyAt=nowMs+cooldown;
 }
 return battle;
}
function uniqueIndices(value,max,limit){
 return Array.isArray(value)&&value.length<=limit&&value.every(x=>Number.isInteger(x)&&x>=0&&x<max)&&new Set(value).size===value.length;
}
const EMPTY_ORDER=Object.freeze({specialIndices:[],numericIndices:[],vitalId:null,op:null,counterVitalId:null,exchangeIndices:[],escortAmmoIndex:null});
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
 const characters=types.filter(isBossCharacterCard);
 if(characters.length>1)return {ok:false,reason:'character_conflict'};
 if(characters.length&&bossCharacterActive(side,battle.round))
  return {ok:false,reason:'character_already_active'};
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
 const ammoIndex=order.escortAmmoIndex??null;
 if(ammoIndex!==null){
  if(!Number.isInteger(ammoIndex)||ammoIndex<0||ammoIndex>=side.numeric.hand.length)
   return {ok:false,reason:'escort_selection'};
  if(ni.includes(ammoIndex)||ei.includes(ammoIndex))
   return {ok:false,reason:'card_double_spend'};
  if(types.some(type=>type.startsWith('fusion-'))||types.includes('tactical-cover'))
   return {ok:false,reason:'escort_tactical_conflict'};
  if(!selectTacticalEscortForAmmo(side,side.numeric.hand[ammoIndex]))
   return {ok:false,reason:'escort_ammo_unavailable'};
 }
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
   !(side.ionized||side.corroded||side.heated||exclusiveNeurotoxinActive(side,battle.round)))
  return {ok:false,reason:'purge_unavailable'};
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
  weaponFocusId:order.weaponFocusId??null,epicChoice:order.epicChoice??null,
  escortAmmoIndex:order.escortAmmoIndex??null
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
// Live numeric change for an OWNED Afrodite deck only. The replaced card is
// spent and the replacement is drawn from its authentic 52-card numeric pile.
// No exchange after Ready, no alteration of a sealed order, no free cards.
export function exchangeTacticalNumericDuringPlanning(battle,key,index,nowMs){
 const denied=reason=>({ok:false,reason,battle});
 if(!battle||battle.phase!=='planning'||!['A','B'].includes(key)||
    battle.orders[key])return denied('already_committed');
 if(!Number.isFinite(nowMs)||nowMs>=battle.deadlineMs)return denied('preparation_expired');
 const original=battle.sides[key],cooldown=tacticalAfroditeRecycleCooldownMs(original);
 if(!cooldown)return denied('harmonic_recycle_unavailable');
 if(!Number.isInteger(index)||index<0||index>=original.numeric.hand.length)
  return denied('numeric_selection');
 const readyAt=original.numericExchangeReadyAt??battle.deadlineMs-TACTICAL_TIMING.prepareMs+cooldown;
 if(nowMs<readyAt)return denied('harmonic_recycle_cooldown');
 const side=clone(original),pile=side.numeric;
 const spent=pile.hand[index];
 let deck=[...pile.deck],discard=[...pile.discard,spent];
 if(deck.length===0){
  deck=shuffle(discard,seedRandom((battle.round*997+(key==='A'?199:311)+
   (side.numericInstantExchanges||0)*129)>>>0));
  discard=[];
 }
 if(!deck.length)return denied('numeric_deck_empty');
 const incoming=deck.shift();
 side.numeric={hand:pile.hand.map((c,i)=>i===index?incoming:c),deck,discard};
 side.numericInstantExchanges=(side.numericInstantExchanges||0)+1;
 side.numericExchangeReadyAt=nowMs+cooldown;
 return {ok:true,reason:'ok',spent:spent.id,drawn:incoming.id,
  battle:{...battle,sides:{...battle.sides,[key]:side},
   lastEvents:[...battle.lastEvents,key+': Afrodite · Ricambio armonico: 1 numerica sostituita dal mazzo vero, prossimo ricambio tra '+cooldown/1000+' s']}};
}

function specialTypes(side,order){return order.specialIndices.map(i=>side.special.hand[i].type);}
function applyPreparation(sides,orders,log,round){
 const status={};
 for(const key of ['A','B']){
  const side=sides[key],types=specialTypes(side,orders[key]);
  expireBossCharacter(side,round);
  const character=types.find(isBossCharacterCard);
  if(character){
   const summoned=activateBossCharacter(side,character,round);
   if(summoned.ok)log.push(key+': Personaggio '+summoned.character.name+
    ' attivato per '+summoned.character.durationCycles+' cicli reali');
  }
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
  // With simultaneous orders the cleanse takes priority over the actual
  // repair card when both are present in the same five-card hand.
  if(types.includes('support-status-purge')&&clearExclusiveNeurotoxin(side,round))
   log.push(key+': Neurotossina rimossa con Pulizia Sistemi');
  if(types.includes('support-shield-repair')){
   const poisoned=exclusiveNeurotoxinActive(side,round);
   const repair=exclusiveNeurotoxinRepairAmount(side,round,20);
   const improved=tacticalAfroditeRepairAmount(side,repair);
   const baseline=improved!==repair?restoreMotherShield(side.defense,repair).repaired:0;
   const fixed=restoreMotherShield(side.defense,improved);
   side.defense=fixed.defense;
   const afroditeExtra=improved!==repair?Math.max(0,fixed.repaired-baseline):0;
   log.push(key+': barriera riparata +'+fixed.repaired+
    (poisoned?' (Neurotossina: −10% riparazione)':'')+
    (improved!==repair?' (Afrodite · Sintesi curativa +'+afroditeExtra+' HP effettivi)':''));
  }
  if(types.includes('support-escort-repair')){
   const escort=side.escorts.find(e=>e.hp>0&&e.hp<e.max);
   const fixed=escort?Math.min(15,escort.max-escort.hp):0;
   if(escort)escort.hp+=fixed;
   log.push(key+': scudiera riparata +'+fixed);
  }
  if(types.includes('support-status-purge')){
   clearTacticalTimedStatuses(side);side.heated=false;
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
function applyBarrierAttack(sides,key,orders,status,log,impacts,modifiers,round,cycleStart){
 const atk=sides[key],def=sides[other(key)],t=status[key],res=status[other(key)];
 const base=nativeBarrierPacket(atk);
 const exclusiveNative=exclusiveBossNativeBonus(atk,base);
 const chronoNative=exclusiveChronoNativeBonus(atk,base,round);
 const abyss=exclusiveLeviatanoNativeBonus(atk,base,cycleStart[other(key)].defense.shield);
 const bloodPact=exclusiveBloodPactNativeBonus(atk,base,round);
 const chaos=exclusiveChaosNativeBonus(atk,base);
 const magma=exclusiveMagmaNativeAdjustment(atk,base,round);
 const magmaDeck=tacticalMagmaNativeBonus(atk,t.types,base);
 const resonanceDeck=tacticalResonanceNativeBonus(atk,t.weaponFocusId,base);
 const characterNative=bossCharacterNativeBonus(atk,def,round,base);
 const supremacy=tacticalSovereignSupremacyBonus(atk,base,round);
 const standardPilot=tacticalCommanderVolleyBonus(atk,def,orders[key],base);
 const advancedPilot=tacticalBossCommanderAttackBonus(atk,def,orders[key],t.types,base,round);
 const pilot=advancedPilot.active?advancedPilot:standardPilot;
 if(pilot.active){
  atk.commander={...atk.commander,bonusRemainder:pilot.remainder};
  log.push(key+': '+pilot.pilotId+' · calcolo '+orders[key].op+
   ' valido, bonus pilota '+pilot.percentage+'% ('+pilot.extra+' HP, resto '+pilot.remainder+'/100)');
 }
 // Every bonus modifies the REAL native weapon packet; two different special
 // cards never exceed the established +45% offensive cap.
 const bonusWithoutAbyss=(t.types.includes('tactic-power-shift')?6:0)+
  (t.types.includes('tactic-kinetic')?6:0)+
  Math.floor(base*t.fusionAssault)+
  (t.tech==='laser'&&!def.escorts.some(e=>e.hp>0)?2:0)+
  (def.corroded?Math.floor(base*.25):0)+
  (def.heated?3:0)+exclusiveNative.extra+chronoNative.extra;
 const cap=Math.floor(base*.45);
 const bonusWithAbyss=bonusWithoutAbyss+abyss.extra;
 const appliedAbyssExtra=Math.min(cap,bonusWithAbyss)-Math.min(cap,bonusWithoutAbyss);
 const bonusWithPact=bonusWithAbyss+bloodPact.extra;
 const appliedBloodPactExtra=Math.min(cap,bonusWithPact)-Math.min(cap,bonusWithAbyss);
 const bonusWithChaos=bonusWithPact+chaos.extra;
 const appliedChaosExtra=Math.min(cap,bonusWithChaos)-Math.min(cap,bonusWithPact);
 const bonusWithCycle=bonusWithChaos+magma.extra;
 const appliedMagmaExtra=Math.min(cap,bonusWithCycle)-Math.min(cap,bonusWithChaos);
 const bonusWithMagmaDeck=bonusWithCycle+magmaDeck.extra;
 const appliedMagmaDeckExtra=Math.min(cap,bonusWithMagmaDeck)-Math.min(cap,bonusWithCycle);
 const bonusWithResonance=bonusWithMagmaDeck+resonanceDeck.extra;
 const appliedResonanceExtra=Math.min(cap,bonusWithResonance)-Math.min(cap,bonusWithMagmaDeck);
 const bonus=bonusWithResonance+supremacy.extra;
 const appliedSupremacyExtra=Math.min(cap,bonus)-Math.min(cap,bonusWithResonance);
 // Il pilota è un modificatore dell'armamento originale, distinto dal
 // tetto +45% delle carte speciali: nessuna munizione extra.
 let total=Math.max(0,base-magma.penalty+
  Math.min(cap,bonus+characterNative.extra)+pilot.extra);
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
 const bossDefenseFactor=tacticalBossMotherFactor(def,res.bossSnapshot);
 const exclusiveDefenseFactor=exclusiveBossShieldFactor(def);
 const pilotDefense=tacticalBossCommanderDefenseBonus(def,atk,round);
 const characterGuard=bossCharacterShieldFactor(def,round);
 const effectivePacket=Math.floor(Math.floor(motherPacket*bossDefenseFactor*
  exclusiveDefenseFactor*pilotDefense.factor*characterGuard)*(modifiers?.shieldDamageFactor||1));
 const hit=damageMotherShield(def.defense,effectivePacket);
 def.defense=hit.defense;
 if(bossCharacterRememberHit(def,round,hit.damage))
  log.push(other(key)+': Personaggio Idra · rigenerazione prevista al prossimo ciclo');
 rememberTacticalBossCommanderImpact(atk,def,orders[key],t.types,hit.damage,round);
 if(pilotDefense.active&&hit.damage>0)
  log.push(other(key)+': Pilota '+pilotDefense.pilotId+' · riduzione '+pilotDefense.percentage+'% sul danno reale alla madre');
 rememberTacticalBossMotherHit(def,hit.damage);
 rememberExclusiveBossDefenseHit(def,hit.damage);
 rememberExclusiveBossNativeHit(atk,hit.damage,exclusiveNative);
 rememberExclusiveChronoNativeHit(atk,round,hit.damage,chronoNative);
 rememberExclusiveLeviatanoNativeHit(atk,hit.damage,abyss);
 rememberTacticalMagmaBarrierHit(atk,hit.damage,magmaDeck);
 rememberTacticalResonanceNativeHit(atk,t.weaponFocusId,hit.damage,resonanceDeck);
 if(resonanceDeck.active&&hit.damage>0)
  log.push(key+': Risonanza (mazzo numerico) · Armi armoniche +'+
   resonanceDeck.percentage+'% ('+appliedResonanceExtra+' HP effettivi)');
 const sovereignNative=rememberTacticalSovereignHit(atk,round,hit.damage,supremacy);
 if(sovereignNative.consumed)
  log.push(key+': Sovrano (mazzo numerico) · Supremazia +'+
   supremacy.percentage+'% ('+appliedSupremacyExtra+' HP applicati, carica consumata)');
 if(magmaDeck.active&&hit.damage>0)
  log.push(key+': Nucleo Magmatico (mazzo numerico) · '+magmaDeck.abilities.join(' + ')+
   ' +'+magmaDeck.percentage+'% ('+appliedMagmaDeckExtra+' HP effettivi)');
 const chaosProgress=rememberExclusiveChaosNativeHit(atk,hit.damage,chaos);
 if(rememberExclusiveIdraBarrierHit(atk,hit.damage,round))
  log.push(key+': Idra Criogenica · Rigenerazione +4 HP programmata per il ciclo successivo');
 if(chaosProgress.released&&hit.damage>0)
  log.push(key+': Generatore del Caos · Scarica del reattore +10% (+'+appliedChaosExtra+
   ' HP effettivi), cariche azzerate');
 else if(atk.bossExclusive?.id===14&&hit.damage>0)
  log.push(key+': Generatore del Caos · Reattore carica '+chaosProgress.charges+'/3');
 if(magma.phase==='eruzione'&&hit.damage>0)
  log.push(key+': Nucleo Magmatico · Eruzione +10% (+'+appliedMagmaExtra+' HP effettivi)');
 if(magma.phase==='raffreddamento')
  log.push(key+': Nucleo Magmatico · Raffreddamento −10% armi native ('+magma.penalty+' HP)');
 if(abyss.active&&hit.damage>0)
  log.push(key+': Leviatano Abissale · Pressione degli abissi +8% sulla salva reale ('+
   'bonus applicato '+appliedAbyssExtra+' HP, resto '+abyss.remainder+
   '/100; barriera nemica <=40% all\'inizio del ciclo)');
 if(bloodPact.active)
  log.push(key+': Signore delle Ombre · Patto di sangue +8% sul pacchetto nativo ('+
   'bonus applicato '+appliedBloodPactExtra+' HP, danno barriera '+hit.damage+
   '; costo 4 HP già pagato anche se il colpo fallisce)');
 if(chronoNative.active&&chronoNative.extra>0&&hit.damage>0)
  log.push(key+': Crono · Controtempo +5% sul pacchetto nativo reale (+'+chronoNative.extra+')');
 if(hit.damage>0&&exclusiveDefenseFactor<1)
  log.push(other(key)+': Gaia · Corazza tellurica consumata (−20% primo impatto alla barriera)');
 if(hit.damage>0&&characterNative.active)
  log.push(key+': Carta Personaggio '+characterNative.id+' · bonus +'+characterNative.pct+'% alle armi native');
 if(hit.damage>0&&characterGuard<1)
  log.push(other(key)+': Carta Personaggio protegge barriera −'+Math.round((1-characterGuard)*100)+'%');
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
  log.push(other(key)+': '+(def.bossNumericDeck?.id==='planet_char_20'?
   'Sovrano · Ultimo presidio / Vuoto difensivo':'Primo anello')+
   ' · impatto alla madre ridotto del '+Math.round((1-bossDefenseFactor)*100)+'%');
 impacts.push({kind:'barrier',by:key,target:other(key),packet:before,intercepted,splash,
  technology:t.tech,damage:hit.damage,weaponIds:atk.weapons.map(w=>w.id),
  pilotBonus:pilot.extra,pilotId:pilot.active?pilot.pilotId:null});
 log.push(key+': armi native '+atk.weapons.map(w=>w.name).join(' + ')+
  ' ('+before+' potenziali, '+intercepted+' intercettati), barriera '+hit.damage);
 return hit.damage;
}
// Escort ordnance exists ONLY if a real numeric card was committed and loaded
// into the catalogued escort weapon. It is a separate shield-only shot, with
// one real interception pass, never a clone of the mother's native volley.
function applyEscortBarrierVolley(sides,key,plan,orders,status,log,impacts,modifiers,motherDamage,round){
 if(!plan)return 0;
 if(!plan.ready){
  if(plan.reason==='charging')
   log.push(key+': scudiera '+(plan.escortSlot+1)+' ricarica '+plan.charge+'/'+plan.threshold+
    ' con una numerica vera (nessun proiettile ancora)');
  return 0;
 }
 const atk=sides[key],def=sides[other(key)],t=status[key],res=status[other(key)];
 const harmony=tacticalResonanceCooperationBonus(atk,plan.packet,motherDamage);
 const characterExtra=bossCharacterEscortExtra(atk,round,plan.packet,motherDamage);
 const packet=Math.min(plan.packet+Math.floor(plan.packet*.45),
  plan.packet+harmony.extra+characterExtra);
 let intercepted=0,suppressed=false;
 const efficiency=escortInterceptionEfficiency(def.defense);
 if(efficiency>0){
  for(const escort of def.escorts){
   if(escort.hp<=0)continue;
   if(t.suppressFirstEscort&&!suppressed){suppressed=true;continue;}
   const baseShare=Number.isFinite(escort.weapon?.interceptShare)?
    Math.min(.45,Math.max(0,escort.weapon.interceptShare)):.20;
   const share=res.ionizedDefense?baseShare*.5:baseShare;
   const absorbed=Math.min(escort.hp,Math.floor(packet*share*efficiency),
    packet-intercepted);
   if(absorbed>0){escort.hp-=absorbed;intercepted+=absorbed;}
  }
 }
 const motherPacket=Math.max(0,packet-intercepted);
 const defenseFactor=tacticalBossMotherFactor(def,res.bossSnapshot);
 const armor=exclusiveBossShieldFactor(def);
 const pilotDefense=tacticalBossCommanderDefenseBonus(def,atk,round);
 const characterGuard=bossCharacterShieldFactor(def,round);
 const actual=Math.floor(Math.floor(motherPacket*defenseFactor*armor*pilotDefense.factor*characterGuard)*
  (modifiers?.shieldDamageFactor||1));
 const hit=damageMotherShield(def.defense,actual);
 def.defense=hit.defense;
 rememberTacticalBossCommanderImpact(atk,def,orders[key],t.types,hit.damage,round);
 if(pilotDefense.active&&hit.damage>0)
  log.push(other(key)+': Pilota '+pilotDefense.pilotId+' · riduzione '+pilotDefense.percentage+'% contro scudiera');
 rememberTacticalBossMotherHit(def,hit.damage);
 rememberExclusiveBossDefenseHit(def,hit.damage);
 rememberTacticalResonanceCooperationHit(atk,hit.damage,harmony);
 if(bossCharacterRememberHit(def,round,hit.damage))
  log.push(other(key)+': Carta Idra · rigenerazione prevista al prossimo ciclo');
 if(characterExtra>0&&hit.damage>0)
  log.push(key+': Carta Cristallo · scudiera +'+characterExtra+' HP potenziali');
 impacts.push({kind:'escort_barrier',by:key,target:other(key),
  packet,intercepted,damage:hit.damage,escortSlot:plan.escortSlot,
  cardId:plan.cardId,escortWeaponId:plan.escortWeaponId,
  weaponIds:[plan.weaponId],technology:'scudiera'});
 log.push(key+': scudiera '+(plan.escortSlot+1)+' · '+plan.weaponName+
  ': numerica '+plan.cardId+' consumata, '+packet+' HP potenziali, '+
  intercepted+' intercettati, '+hit.damage+' danni reali alla barriera');
 if(harmony.active&&hit.damage>0)
  log.push(key+': Risonanza (mazzo numerico) · Sinfonia di flotta +'+
   harmony.percentage+'% (+'+harmony.extra+' HP sul colpo scudiera, resto '+
   harmony.remainder+'/100; madre e scudiera hanno colpito entrambe)');
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
  if(rememberExclusiveChronoCounter(def,round))
   log.push(other(key)+': Crono · Controtempo caricato da Contromisura programmata effettiva, per i prossimi 2 cicli');
  const counterSync=bossCharacterCounterSync(def,round,true);
  const awarded=Math.min(counterSync,Math.max(0,100-def.sync));
  def.sync+=awarded;
  if(awarded>0)log.push(other(key)+': Carta Crono · Contromisura efficace +'+awarded+' Sincronia');
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
 const voidBonus=exclusiveVoidPrecisionBonus(atk,cards,damage,round);
 damage+=voidBonus.extra;
 const magmaVital=tacticalMagmaVitalBonus(atk,order,{...def,defense},damage);
 damage+=magmaVital.extra;
 const resonanceVital=tacticalResonanceVitalBonus(atk,{...def,defense},order,damage);
 damage+=resonanceVital.extra;
 const supremacy=tacticalSovereignSupremacyBonus(atk,damage,round);
 damage+=supremacy.extra;
 const characterPrecision=bossCharacterPrecisionExtra(atk,round,cards,damage);
 damage+=characterPrecision;
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
 const bossDefenseFactor=tacticalBossMotherFactor(def,status[other(key)].bossSnapshot);
 const pilotDefense=tacticalBossCommanderDefenseBonus(def,atk,round);
 damage=Math.floor(damage*bossDefenseFactor*pilotDefense.factor);
 const hit=hitMotherPart(defense,target,damage,cards);
 const consequence=hit.damage>0?tacticalVitalTransition(defense,hit.defense,target):null;
 def.defense=hit.defense;
 if(characterPrecision>0&&hit.damage>0)
  log.push(key+': Carta Sovrano · precisione multi-seme +'+characterPrecision+' HP potenziali');
 rememberTacticalBossCommanderImpact(atk,def,order,status[key].types,hit.damage,round,{vitalId:target});
 if(pilotDefense.active&&hit.damage>0)
  log.push(other(key)+': Pilota '+pilotDefense.pilotId+' · riduzione '+pilotDefense.percentage+'% sul vitale '+target);
 rememberTacticalBossMotherHit(def,hit.damage);
 rememberTacticalBossVitalHit(atk,target,hit.damage,tharsis);
 rememberTacticalBossOutgoingHit(atk,hit.damage,ombre);
 rememberTacticalIdraHit(atk,hit.damage,idra,{vitalId:target});
 rememberTacticalLeviatanoHit(atk,hit.damage,leviatano);
 rememberTacticalMagmaVitalHit(atk,hit.damage,magmaVital);
 rememberTacticalResonanceVitalHit(atk,hit.damage,resonanceVital);
 if(resonanceVital.active&&hit.damage>0)
  log.push(key+': Risonanza (mazzo numerico) · Frequenza multipla +'+
   resonanceVital.percentage+'% ('+resonanceVital.extra+' HP prima delle difese)');
 const sovereignPrecision=rememberTacticalSovereignHit(atk,round,hit.damage,supremacy,
  {destroyedEnemyVital:hit.destroyed});
 if(sovereignPrecision.armed)
  log.push(key+': Sovrano (mazzo numerico) · Supremazia armata dal KO di un vitale reale (prossimo ciclo)');
 if(sovereignPrecision.consumed)
  log.push(key+': Sovrano (mazzo numerico) · Supremazia +'+supremacy.percentage+
   '% sul colpo valido (+'+supremacy.extra+' HP prima delle difese, carica consumata)');
 if(magmaVital.active&&hit.damage>0)
  log.push(key+': Nucleo Magmatico (mazzo numerico) · Forgia moltiplicatrice +'+
   magmaVital.percentage+'% ('+magmaVital.extra+' HP prima delle difese)');
 if(rememberExclusiveVoidCounter(def,hit.damage,cards,round))
  log.push(other(key)+': Sovrano del Vuoto · seme dominante '+exclusiveVoidDominantSuit(round)+
   ' contrastato da un vero colpo vitale, bonus disattivato nel prossimo ciclo');
 if(voidBonus.active&&hit.damage>0)
  log.push(key+': Sovrano del Vuoto · '+voidBonus.suit+
   ' dominante: +7% sul colpo valido ('+voidBonus.extra+' HP prima delle difese)');
 if(cancelExclusiveIdraByHeart(def,hit.damage,cards,round))
  log.push(other(key)+': Idra Criogenica · Rigenerazione annullata da Cuori su vitale esposto');
 if(rememberExclusiveVenusPrecisionHit(atk,def,hit.damage,round))
  log.push(key+': Matriarca Tossica · Neurotossina inflitta a '+other(key)+
   ' (prossimo ciclo: −10% alla riparazione della barriera, rimovibile con Pulizia Sistemi)');
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
  log.push(other(key)+': '+(def.bossNumericDeck?.id==='planet_char_20'?
   'Sovrano · Ultimo presidio / Vuoto difensivo':'Primo anello')+
   ' · colpo vitale ridotto del '+Math.round((1-bossDefenseFactor)*100)+'%');
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
 // Planning does not consume actual combat seconds.
 for(const key of ['A','B'])for(const type of ['ionized','corroded']){
  if(sides[key].statusUntil)
   sides[key][type]=tacticalStatusActive(sides[key],type,battle.round);
 }
 const before=combatSnapshot(sides),impacts=[];
 const environmentStage=arenaEnvironment(battle.arenaId,battle.arenaValidCalculations+1).stage;
 const modifiers=arenaPhaseModifiers(battle.arenaId,environmentStage);
 const playedSpecials=Object.fromEntries(['A','B'].map(key=>[key,
  orders[key].specialIndices.map(i=>sides[key].special.hand[i].type)]));
 const log=['Scontro '+battle.round+' — ordini rivelati simultaneamente'];
 for(const key of ['A','B']){
  const healed=bossCharacterApplyRegen(sides[key],battle.round);
  if(healed>0)log.push(key+': Carta Idra · rigenerazione reale +'+healed+' HP alla barriera');
 }
 const idraRegen=prepareExclusiveIdraRegen(sides.B,battle.round);
 if(idraRegen.repaired>0)
  log.push('B: Idra Criogenica · Rigenerazione +'+idraRegen.repaired+' HP reali alla barriera');
 const magmaStage=exclusiveMagmaPhase(sides.B,battle.round);
 if(magmaStage)log.push('B: Nucleo Magmatico · fase '+magmaStage.toUpperCase()+' del ciclo');
 // Boss Plutone pays REAL shield HP at cycle start, BEFORE all card repairs,
 // native volleys and precision. This never reads the opponent's hidden order.
 const bloodPact=prepareExclusiveBloodPact(sides.B,battle.round,nativeBarrierPacket(sides.B));
 if(bloodPact.armed)
  log.push('B: Signore delle Ombre · Patto di sangue: -'+bloodPact.paid+
   ' HP reali alla propria barriera, +8% armato per questo scontro');
 const status=applyPreparation(sides,orders,log,battle.round);
 // Queue real escort munitions BEFORE either mother shot. A scudiera that
 // falls during simultaneous exchange retains its already-loaded shot.
 const escortPlans=Object.fromEntries(['A','B'].map(key=>[key,
  orders[key].escortAmmoIndex==null?null:prepareTacticalEscortVolley(sides[key],
   sides[key].numeric.hand[orders[key].escortAmmoIndex])]));
 const prepared=combatSnapshot(sides);
 const a=applyBarrierAttack(sides,'A',orders,status,log,impacts,modifiers,battle.round,before);
 const b=applyBarrierAttack(sides,'B',orders,status,log,impacts,modifiers,battle.round,before);
 const escortA=applyEscortBarrierVolley(sides,'A',escortPlans.A,orders,status,log,impacts,modifiers,a,battle.round);
 const escortB=applyEscortBarrierVolley(sides,'B',escortPlans.B,orders,status,log,impacts,modifiers,b,battle.round);
 // Urano: only the B boss can siphon. Use the already-computed REAL barrier
 // damage after escort intercept/defense. Sync moved here is pre-reward sync:
 // no stealing the 25/50 sync that players will earn later in this cycle.
 // Fusion costs were paid during preparation, so spent sync cannot be stolen.
 const ionicSiphon=transferExclusiveIonicSync(sides.B,sides.A,b);
 if(ionicSiphon.transferred>0)
  log.push('B: Sentinella Ionica · Sifone Quantico trasferisce '+
   ionicSiphon.transferred+' Sincronia reale da A a B');
 const resonance=collectExclusiveResonanceSync(sides.B,b,battle.round);
 if(resonance>0)
  log.push('B: Cristallo di Risonanza · Memoria degli scarti +'+resonance+
   ' Sincronia reale (due o più carte numeriche scartate nel ciclo precedente)');
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
  const spentNumerics=[...order.numericIndices,...order.exchangeIndices,
   ...(order.escortAmmoIndex==null?[]:[order.escortAmmoIndex])];
  if(order.exchangeIndices.length>0)
   side.numericRecyclesTotal=(side.numericRecyclesTotal||0)+order.exchangeIndices.length;
  side.numeric=recyclePile(previousNumerics,spentNumerics,7,random,
   tacticalEpicNumericChoice(side,battle.round));
  rememberTacticalLeviatanoRecycle(side,previousNumerics,spentNumerics.length);
  const earned=25+((key==='A'?hitsA:hitsB)>0?25:0)+
   (validCalculation[key]?modifiers.syncPerCalculation:0);
  const extraEnergy=tacticalGeneratorSyncBonus(side,earned);
  const characterEnergy=bossCharacterSyncExtra(side,battle.round,validCalculation[key]);
  const normalSync=Math.min(100,side.sync+earned);
  side.sync=Math.min(100,side.sync+earned+extraEnergy+characterEnergy);
  const effectiveEnergy=side.sync-normalSync;
  if(effectiveEnergy>0){
   if(extraEnergy>0)log.push(key+': Generatore (mazzo numerico) · Accumulo energetico +'+
    Math.min(effectiveEnergy,extraEnergy)+' Sincronia da eventi reali');
   if(characterEnergy>0)log.push(key+': Carta Generatore · calcolo valido, Sincronia extra (entro 100)');
  }
  if(side.epic.exchangeUntilRound===battle.round){
   side.epic.exchangeCredits=0;side.epic.exchangeUntilRound=0;
  }
  // Persistent status is ONE following cycle only, and requires a real barrier hit.
  const enemyKey=other(key);
  const enemyShieldDamage=enemyKey==='A'?a:b;
  const enemyStatus=status[enemyKey];
  const ionHit=enemyShieldDamage>0&&
   (enemyStatus.types.includes('shot-ion')||enemyStatus.tech==='ionico');
  const enemyCharacter=bossCharacterActive(sides[enemyKey],battle.round);
  const corrosionHit=enemyShieldDamage>0&&(
   enemyStatus.types.includes('shot-corrosion')||enemyCharacter?.effect==='corrosion');
  if(ionHit){
   const duration=applyTacticalTimedStatus(side,'ionized',battle.round,{
    ...modifiers,characterIonFactor:bossCharacterIonFactor(side,battle.round)});
   log.push(key+': ionizzazione '+duration.durationMs/1000+' s di combattimento (preparazione sospesa)');
  }else side.ionized=(side.statusUntil?.ionized||0)>tacticalCombatClock(battle.round+1);
  if(corrosionHit){
   const duration=applyTacticalTimedStatus(side,'corroded',battle.round,modifiers);
   log.push(key+': corrosione '+duration.durationMs/1000+' s di combattimento (preparazione sospesa)');
  }else side.corroded=(side.statusUntil?.corroded||0)>tacticalCombatClock(battle.round+1);
  side.heated=enemyShieldDamage>0&&enemyStatus.tech==='plasma'&&
   !tacticalEpicProtectsFromHeat(side,battle.round);
  // A hit this cycle schedules the next round; previous status expires now.
  expireExclusiveNeurotoxin(side,battle.round);
 }
 // Only the numeric cards actually spent by player A are public now;
 // they can arm the boss for the NEXT round, never retroactively.
 if(rememberExclusiveResonanceDiscards(sides.B,
   orders.A.numericIndices.length+orders.A.exchangeIndices.length+
    Number(orders.A.escortAmmoIndex!=null),battle.round))
  log.push('B: Cristallo di Risonanza · Memoria degli scarti armata per il prossimo ciclo');
 resolveTacticalEpicAfterCombat(sides,battle.round,impacts,log);
 let winner=winState(sides);
 if(battle.round>=TACTICAL_TIMING.maxRounds&&!winner)winner='draw';
 log.push('Barriere: A '+sides.A.defense.shield.hp+'/60; B '+sides.B.defense.shield.hp+'/60');
 if(winner)log.push(winner==='draw'?'Pareggio: limite/doppio KO':'Vince '+winner);
 return {...battle,sides,phase:'resolving',resolveUntilMs:nowMs+TACTICAL_TIMING.resolveMs,
  arenaValidCalculations:battle.arenaValidCalculations+Number(validCalculation.A)+Number(validCalculation.B),
  orders,history:[...battle.history,{round:battle.round,orders,events:log,
   shieldA:a+escortA,shieldB:b+escortB,escortA,escortB,hitsA,hitsB,
   snapshots:{before,prepared,afterBarrier,afterPrecision},impacts,playedSpecials,
   environmentStage}],lastEvents:log,winner};
}
export function advanceTacticalDuel(battle,nowMs=0){
 if(!Number.isFinite(nowMs))throw new Error('Orologio non valido');
 if(battle.phase==='finished')return battle;
 if(battle.phase==='resolving'){
  if(nowMs<battle.resolveUntilMs)return battle;
  if(battle.winner)return {...battle,phase:'finished'};
  const nextRound=battle.round+1;
  const bossSuit=battle.sides.B.bossExclusive?.id===20?exclusiveVoidDominantSuit(nextRound):null;
  const bossMagma=exclusiveMagmaPhase(battle.sides.B,nextRound);
  return {...battle,phase:'planning',round:nextRound,orders:{A:null,B:null},
   deadlineMs:nowMs+TACTICAL_TIMING.prepareMs,resolveUntilMs:null,
   lastEvents:bossSuit?[...battle.lastEvents,
    'B: Sovrano del Vuoto · seme dominante '+bossSuit+' per il ciclo '+nextRound
   ]:bossMagma?[...battle.lastEvents,
    'B: Nucleo Magmatico · fase '+bossMagma.toUpperCase()+' per il ciclo '+nextRound
   ]:battle.lastEvents};
 }
 if(battle.phase!=='planning')return battle;
 if(battle.orders.A&&battle.orders.B||nowMs>=battle.deadlineMs){
  const orders={A:battle.orders.A??clone(EMPTY_ORDER),B:battle.orders.B??clone(EMPTY_ORDER)};
  return resolveCycle({...battle,orders},nowMs);
 }
 return battle;
}
