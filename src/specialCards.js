// Eclissi Stellare - punti 22B/25: mano speciale separata. Le carte attivano le abilità;
// nessun potere deriva automaticamente dai semi delle carte numeriche.
import {startFusion,activateTacticalCover} from './fleetManeuvers.js';
import {armShotEffect,armedShotEffects,SHOT_RULES} from './strategicShots.js';
import {useSupportCard} from './specialSupport.js';
import {BOSS_CHARACTER_CATALOG,isBossCharacterCard} from './bossCharacterCards.js';
import {PVP_TERRAIN_CATALOG} from './pvpTerrainCards.js';
import {TACTICAL_EPIC_CARDS,isTacticalEpic} from './tacticalEpicCards.js';
import {TACTICAL_MODULE_CARDS,isModuleCard} from './tacticalEquipmentCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {VULNERABILITY_RIFT_CARD_ID,VULNERABILITY_RIFT_PROTECTED_DAMAGE_CAP} from './tacticalVulnerabilityRift.js';
import {LEGACY_DICE_CARD,LEGACY_BOMB_CARD,LEGACY_MALUS_CARD,LEGACY_GOLD_CARD} from './tacticalLegacyEvents.js';

// Carte tattiche gia' eseguibili nel motore simultaneo ma assenti
// dall'inventario storico: da pacchetti, ZERO copie gratis in migrazione.
export const TACTICAL_ONLY_SPECIAL_TYPES=Object.freeze([
 'tactic-power-shift','tactic-scan','tactic-suppress','tactic-counter',
 'tactic-reactive','tactic-kinetic','tactic-impact','tactic-numeric-recycle'
]);
export const SPECIAL_HAND_SIZE=5;
export const SPECIAL_CARD_CATALOG=Object.freeze({
 'fusion-barrier':Object.freeze({type:'fusion-barrier',name:'Fusione Barriera',short:'BARRIERA',
   family:'fusion',mode:'barrier',description:'Aggancia una scudiera per proteggere la madre usando il suo scudo.'}),
 'fusion-strike':Object.freeze({type:'fusion-strike',name:'Fusione Assalto',short:'ASSALTO',
   family:'fusion',mode:'strike',description:'Aggancia una scudiera e potenzia il fuoco della madre contro lo scudo avversario.'}),
 'fusion-twin':Object.freeze({type:'fusion-twin',name:'Fusione Gemellare',short:'GEMELLARE',
   family:'fusion',mode:'twin',description:'Unisce entrambe le scudiere: niente fuoco di scorta, intercettazione maggiorata con i loro veri scudi.'}),
 'fusion-triad':Object.freeze({type:'fusion-triad',name:'Fusione Trina',short:'TRINA',
   family:'fusion',mode:'triad',description:'Aggancia le due scudiere alla madre: fuoco madre potenziato e protezione reale. Richiede entrambe le scudiere.'}),
 'tactical-cover':Object.freeze({type:'tactical-cover',name:'Copertura Tattica',short:'COPERTURA',
   family:'defense',description:'La prima scudiera protegge la madre dal prossimo colpo consumando il proprio scudo.'}),
 'shot-piercing':Object.freeze({type:'shot-piercing',name:'Colpo Perforante',short:'PERFORANTE',
   family:'volley',description:'Il prossimo tiro allo scudo madre aggira parte della scorta, MAI le firme dei vitali.'}),
 'shot-ion':Object.freeze({type:'shot-ion',name:'Impulso Ionico',short:'IONICO',
   family:'volley',description:'Un colpo effettivo allo scudo madre riduce per poco tempo le intercettazioni automatiche nemiche.'}),
 'shot-corrosion':Object.freeze({type:'shot-corrosion',name:'Corrosione',short:'CORROSIONE',
   family:'volley',description:'Un colpo allo scudo madre lo indebolisce per il colpo successivo; non perfora i vitali.'}),
 'support-shield-repair':Object.freeze({type:'support-shield-repair',name:'Riparazione Scudo',short:'RIPARAZIONE',
   family:'support',description:'Ripara fino a 20 HP dello scudo madre. Il generatore danneggiato riduce l’efficacia; a KO blocca la riparazione.'}),
 'support-status-purge':Object.freeze({type:'support-status-purge',name:'Pulizia Sistemi',short:'PURIFICAZIONE',
   family:'support',description:'Rimuove Ionizzazione e Corrosione attive dalla propria madre, senza creare HP.'}),
 'support-escort-repair':Object.freeze({type:'support-escort-repair',name:'Riparazione Scudiera',short:'SCUDIERA +',
   family:'support',description:'Ripara fino a 15 HP dello scudo della scudiera selezionata. Non rianima scudiere distrutte; richiede centralina attiva.'}),
 [LEGACY_DICE_CARD]:Object.freeze({type:LEGACY_DICE_CARD,name:'Dado Quantico',short:'DADO',family:'quantum',
  description:'Carta attivabile solo dopo tre formule differenti. Consuma una delle 24 speciali e lancia una delle sei facce tattiche.'}),
 [LEGACY_BOMB_CARD]:Object.freeze({type:LEGACY_BOMB_CARD,name:'Numero Bomba',short:'BOMBA',family:'sabotage',
  description:'Marca uno slot numerico nemico dopo il ripescaggio. Disinnesco: ricambio o formula valida; altrimenti −8 barriera entro 2 cicli.'}),
 [LEGACY_MALUS_CARD]:Object.freeze({type:LEGACY_MALUS_CARD,name:'Barra Malus',short:'MALUS',family:'sabotage',
  description:'Richiede tre colpi validi a vitali. Consuma la carica per un disturbo nemico limitato a un ciclo.'}),
 [LEGACY_GOLD_CARD]:Object.freeze({type:LEGACY_GOLD_CARD,name:'Carta Dorata',short:'DORATA',family:'transmute',
  description:'Trasforma una tua numerica esistente per due cicli. Bonus per seme soltanto con una formula valida; nessuna valuta assegnata.'}),
 [VULNERABILITY_RIFT_CARD_ID]:Object.freeze({type:VULNERABILITY_RIFT_CARD_ID,
   name:'Faglia di Vulnerabilità',short:'FAGLIA',family:'rift',maxCopies:1,
   description:'Una formula valida colpisce un vitale anche con barriera attiva; danno massimo '+VULNERABILITY_RIFT_PROTECTED_DAMAGE_CAP+' HP se protetto. Una volta per battaglia. Non rivela la firma e non evita le Contromisure.'}),
 [SIGNATURE_MUTATION_CARD_ID]:Object.freeze({type:SIGNATURE_MUTATION_CARD_ID,
   name:'Mutazione della Firma',short:'MUTA FIRMA',family:'mutation',
   description:'Cambia per un ciclo la formula di un proprio sistema vitale già esposto. La vecchia combinazione nemica non è più valida; non modifica gli HP.'}),
 'tactic-power-shift':Object.freeze({type:'tactic-power-shift',name:'Deviazione Energia',
  short:'DEVIAZIONE',family:'offense',description:'Carta tattica: +6 danni al colpo verso la barriera con contraccolpo +3 secondo le regole del motore.'}),
 'tactic-scan':Object.freeze({type:'tactic-scan',name:'Scansione Tattica',short:'SCANSIONE',
  family:'intel',description:'Rivela due firme dei vitali avversari usando una Carta Speciale realmente pescata e consumata.'}),
 'tactic-suppress':Object.freeze({type:'tactic-suppress',name:'Soppressione Scorta',
  short:'SOPPRESSIONE',family:'offense',description:'Disattiva temporaneamente la prima intercettazione della scudiera avversaria secondo le regole tattiche.'}),
 'tactic-counter':Object.freeze({type:'tactic-counter',name:'Contromisura Programmata',
  short:'CONTROMISURA',family:'reaction',description:'Blocca nello scontro corrente un colpo di precisione contro il vitale indicato.'}),
 'tactic-reactive':Object.freeze({type:'tactic-reactive',name:'Paratia Reattiva',
  short:'PARATIA',family:'defense',description:'Protegge la barriera assorbendo fino a 9 HP secondo le regole dello scontro.'}),
 'tactic-kinetic':Object.freeze({type:'tactic-kinetic',name:'Carica Cinetica',
  short:'CINETICA',family:'offense',description:'Aumenta di 6 HP il colpo nativo alla barriera secondo le condizioni del motore.'}),
 'tactic-impact':Object.freeze({type:'tactic-impact',name:"Schermo d'Urto",
  short:'URTO',family:'defense',description:'Riduce del 20% il colpo diretto alla barriera durante lo scontro corrente.'}),
 'tactic-numeric-recycle':Object.freeze({type:'tactic-numeric-recycle',name:'Ricambio Numerico',
  short:'RICAMBIO',family:'support',description:'Permette di scartare e ripescare due numeriche del mazzo autentico, senza generarne altre.'}),
 ...Object.fromEntries(Object.values(BOSS_CHARACTER_CATALOG).map(c=>[c.id,
  Object.freeze({type:c.id,name:c.name,short:c.short,family:'boss-character',
   description:c.description,durationCycles:c.durationCycles,imagePath:c.imagePath,maxCopies:1})])),
  ...Object.fromEntries(Object.values(TACTICAL_MODULE_CARDS).map(c=>[c.id,
  Object.freeze({type:c.id,name:c.name,short:c.short,family:'equipment',description:c.description,maxCopies:1})])),
 ...Object.fromEntries(Object.values(TACTICAL_EPIC_CARDS).map(item=>[item.id,
   Object.freeze({type:item.id,name:item.name,short:item.short,family:'epic',
    description:item.help,durationCycles:item.cycles,maxCopies:1})])),
  ...Object.fromEntries(Object.values(PVP_TERRAIN_CATALOG).map(t=>[t.id,
   Object.freeze({type:t.id,name:t.name,short:t.short,family:'terrain',
    description:t.description,durationCycles:t.durationCycles,imagePath:t.imagePath})]))
});
export const specialCardMaxCopies=type=>type===VULNERABILITY_RIFT_CARD_ID||isBossCharacterCard(type)||isTacticalEpic(type)||isModuleCard(type)?1:SPECIAL_DECK_COPY_LIMIT;
// Regole confermate il 6 novembre 2026: dimensione mazzo e limite per tipo.
export const SPECIAL_DECK_SIZE=24;
export const SPECIAL_DECK_COPY_LIMIT=6;
export const SPECIAL_DEFAULT_TYPES=Object.freeze(Array.from({length:SPECIAL_DECK_SIZE},(_,i)=>
 ['fusion-barrier','fusion-strike','tactical-cover','shot-piercing','shot-ion','shot-corrosion'][i%6]));
export function makeSpecialInstances(typeList=SPECIAL_DEFAULT_TYPES){
 if(!Array.isArray(typeList)||typeList.length!==SPECIAL_DECK_SIZE||
    typeList.some(type=>!Object.hasOwn(SPECIAL_CARD_CATALOG,type)))
  throw new Error('Mazzo speciale non valido');
 const copies={};
 for(const type of typeList){
  copies[type]=(copies[type]||0)+1;
  if(copies[type]>specialCardMaxCopies(type))throw new Error('Troppe copie di una speciale');
 }
 return typeList.map((type,i)=>({id:'special-'+String(i+1).padStart(2,'0'),type}));
}
function sample01(rng){
 const value=Number(rng());
 return Number.isFinite(value)?Math.min(.999999999999,Math.max(0,value)):0;
}
function shuffled(cards,rng){
 const result=[...cards];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(sample01(rng)*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
// Una carta speciale usata viene sostituita immediatamente, anche se si
// sono già utilizzate altre speciali nella stessa azione di combattimento.
export function refillSpecialHand(side,rng=Math.random){
 let hand=[...(side.specialHand||[])];
 let deck=[...(side.specialDeck||[])],discard=[...(side.specialDiscard||[])];
 while(hand.length<SPECIAL_HAND_SIZE&&(deck.length||discard.length)){
  if(!deck.length){deck=shuffled(discard,rng);discard=[];}
  hand.push(deck.pop());
 }
 return {...side,specialHand:hand,specialDeck:deck,specialDiscard:discard};
}
export function initializeSpecialDeck(side,rng=Math.random,loadout=null){
 if(side.specialHand&&side.specialDeck&&side.specialDiscard)return side;
 const cards=makeSpecialInstances(loadout??SPECIAL_DEFAULT_TYPES);
 return refillSpecialHand({...side,specialHand:[],
  specialDeck:shuffled(cards,rng),specialDiscard:[],specialUses:0},rng);
}
export function specialCardDefinition(card){
 return card?SPECIAL_CARD_CATALOG[card.type]??null:null;
}
export function findFusionCardIndex(side,mode){
 return (side.specialHand||[]).findIndex(card=>specialCardDefinition(card)?.mode===mode);
}
export function findVolleyCardIndex(side,preferredTypes=['shot-piercing','shot-ion','shot-corrosion']){
 const next=armedShotEffects(side);
 return (side?.specialHand||[]).findIndex(card=>preferredTypes.includes(card?.type)&&!next.includes(card?.type));
}
export function findCoverCardIndex(side){
 return (side.specialHand||[]).findIndex(card=>card?.type==='tactical-cover');
}
export function specialCardReadiness(side,handIndex,escortSlot,nowMs=Date.now()){
 if(!Array.isArray(side?.specialHand)||!Number.isInteger(handIndex)
  ||handIndex<0||handIndex>=side.specialHand.length)
  return {ready:false,reason:'card_missing'};
 const definition=specialCardDefinition(side.specialHand[handIndex]);
 if(!definition)return {ready:false,reason:'unknown_card'};
 if(!side.maneuvers)return {ready:false,reason:'ability_unavailable',definition};
 let action;
 if(definition.family==='fusion')action=startFusion(side.maneuvers,side,escortSlot,definition.mode,nowMs);
 else if(definition.family==='defense')action=activateTacticalCover(side.maneuvers,side,escortSlot,nowMs);
 else if(definition.family==='volley'){
  const armed=armShotEffect(side,definition.type);
  return {ready:armed.armed,reason:armed.reason,definition,armedSide:armed.side};
 }else if(definition.family==='support'){
  const support=useSupportCard(side,definition.type,nowMs,escortSlot);
  return {ready:support.activated,reason:support.reason,definition,
   supportSide:support.side,amount:support.amount||0};
 }else return {ready:false,reason:'ability_unavailable',definition};
 return {ready:!!(action.started||action.activated),reason:action.reason,state:action.state,definition};
}
export function playSpecialCard(side,handIndex,{escortSlot}={},nowMs=Date.now(),rng=Math.random){
 const ready=specialCardReadiness(side,handIndex,escortSlot,nowMs);
 if(!ready.ready)return {played:false,reason:ready.reason,side};
 const hand=[...side.specialHand];
 const [used]=hand.splice(handIndex,1);
 const patch=ready.supportSide?{fleet:ready.supportSide.fleet,
  escorts:ready.supportSide.escorts,
  strategicStatuses:ready.supportSide.strategicStatuses}:
  ready.armedSide?{armedVolleyEffects:ready.armedSide.armedVolleyEffects}:
  {maneuvers:ready.state};
 const next=refillSpecialHand({...side,...patch,
  specialHand:hand,specialDiscard:[...side.specialDiscard,used],
  specialUses:(side.specialUses||0)+1},rng);
 return {played:true,reason:'ok',side:next,card:used,definition:ready.definition,amount:ready.amount||0};
}
