// Eclissi Stellare: 12 distinct, LIMITED-DURATION playable BOSS CHARACTERS.
// They are SPECIAL cards acquired only after actually defeating a planet boss.
// Not the enemy's exclusive power, not a numeric boss-deck passive, not a pilot.
// One active playable character PER SIDE for two combat cycles maximum.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {restoreMotherShield} from './vitalDefense.js';
import {pvpTerrainRepairAmount} from './pvpTerrainCards.js';
import {exclusiveNeurotoxinRepairAmount,exclusiveNeurotoxinActive,clearExclusiveNeurotoxin}
 from './tacticalExclusiveBosses.js';
const defs=[
 [1,'Guardiano di Gaia','Riparo tellurico','armor','Scudo madre: -15% ai colpi reali sulla barriera, per due cicli.'],
 [2,'Colosso di Tharsis','Furia controllata','assault','Armi native +8% sulla barriera, soltanto sui colpi reali.'],
 [3,'Matriarca Tossica','Spora corrosiva','corrosion','Una salva nativa dannosa può applicare Corrosione autentica, rimovibile con Pulizia.'],
 [6,'Crono il Distruttore','Contrattacco cronometrico','counter','Una Contromisura che ferma un vero attacco vitale genera +8 Sincronia.'],
 [7,'Sentinella Ionica','Gabbia dielettrica','ionGuard','Gli impulsi ionici subiti durano il 30% in meno.'],
 [8,'Leviatano Abissale','Guardia degli abissi','escortGuard','Con almeno una scudiera viva: -12% al danno sulla barriera madre.'],
 [9,'Signore delle Ombre','Lama delle ombre','shadow','Con scudo proprio al 35% o meno all’inizio del ciclo, armi native +9%.'],
 [11,'Idra Criogenica','Riserva criogenica','regeneration','Dopo un colpo reale alla propria barriera, ripara fino a 4 HP nel ciclo successivo (una volta).'],
 [14,'Generatore del Caos','Convertitore di flusso','sync','Un calcolo matematico valido concede +5 Sincronia effettiva, fino a 100.'],
 [17,'Cristallo di Risonanza','Coro delle scudiere','harmonic','Scudiera +10% se anche la madre colpisce la barriera nello stesso ciclo.'],
 [19,'Nucleo Magmatico','Forgia instabile','magma','Armi native +8% se il nemico era già corroso all’inizio del ciclo.'],
 [20,'Sovrano del Vuoto','Frattura del vuoto','precision','Precisione valida con almeno due semi diversi: +8% al danno su vitale esposto.']
];
export const BOSS_CHARACTER_DURATION_CYCLES=2;
export const BOSS_CHARACTER_CATALOG=Object.freeze(Object.fromEntries(defs.map(
 ([planetId,name,skill,effect,description])=>{
  const id='boss-character-'+planetId;
  return [id,Object.freeze({id,planetId,name,skill,effect,description,
   family:'boss-character',short:skill.toUpperCase(),durationCycles:BOSS_CHARACTER_DURATION_CYCLES,
   imagePath:'/assets/boss-characters/'+id+'.svg',maxCopies:1})];
 })));
export const BOSS_CHARACTER_TYPES=Object.freeze(Object.keys(BOSS_CHARACTER_CATALOG));
if(defs.length!==12||new Set(defs.map(row=>row[0])).size!==12||
 PHASE16A_CAMPAIGN_PLANETS.some(p=>!Object.hasOwn(BOSS_CHARACTER_CATALOG,'boss-character-'+p.id)))
 throw new Error('Le dodici Carte Personaggio Boss non corrispondono ai pianeti ufficiali');
export const bossCharacterDefinition=type=>BOSS_CHARACTER_CATALOG[type]??null;
export const isBossCharacterCard=type=>Object.hasOwn(BOSS_CHARACTER_CATALOG,type);
export const bossCharacterTypeForPlanet=id=>
 Object.hasOwn(BOSS_CHARACTER_CATALOG,'boss-character-'+Number(id))?
  'boss-character-'+Number(id):null;
export function bossCharacterActive(side,round){
 const state=side?.bossCharacter;
 return state&&round>=state.startedRound&&round<=state.untilRound?
  bossCharacterDefinition(state.id):null;
}
export function activateBossCharacter(side,type,round){
 if(!isBossCharacterCard(type))return {ok:false,reason:'unknown_character'};
 if(side?.bossCharacter&&side.bossCharacter.untilRound>=round)
  return {ok:false,reason:'character_already_active'};
 const def=bossCharacterDefinition(type);
 side.bossCharacter={id:type,startedRound:round,untilRound:round+def.durationCycles-1,
  regenDue:0,regenerated:false};
 return {ok:true,character:def};
}
export function expireBossCharacter(side,round){
 if(side?.bossCharacter&&side.bossCharacter.untilRound<round){
  side.bossCharacter=null;return true;
 }
 return false;
}
export function bossCharacterNativeBonus(side,enemy,round,base,shieldHpAtStart=null){
 const character=bossCharacterActive(side,round);
 if(!character||!(base>0))return {active:false,extra:0};
 const kind=character.effect;
 const startingHp=Number.isFinite(shieldHpAtStart)?shieldHpAtStart:side.defense.shield.hp;
 const eligible=kind==='assault'||
  kind==='shadow'&&startingHp<=side.defense.shield.max*.35||
  kind==='magma'&&!!enemy?.corroded;
 if(!eligible)return {active:false,extra:0};
 const pct=kind==='shadow'?9:8;
 return {active:true,pct,extra:Math.floor(base*pct/100),id:character.id};
}
export function bossCharacterShieldFactor(side,round){
 const char=bossCharacterActive(side,round);
 if(char?.effect==='armor')return .85;
 if(char?.effect==='escortGuard'&&side.escorts.some(e=>e.hp>0))return .88;
 return 1;
}
export function bossCharacterIonFactor(side,round){
 return bossCharacterActive(side,round)?.effect==='ionGuard' ? .70 : 1;
}
export function bossCharacterPrecisionExtra(side,round,cards,damage){
 if(bossCharacterActive(side,round)?.effect!=='precision'||!(damage>0)||
   new Set(cards.map(c=>c.suit)).size<2)return 0;
 return Math.floor(damage*.08);
}
export function bossCharacterEscortExtra(side,round,packet,motherDamage){
 if(bossCharacterActive(side,round)?.effect!=='harmonic'||
    !(motherDamage>0)||!(packet>0))return 0;
 return Math.max(1,Math.floor(packet*.10));
}
export function bossCharacterSyncExtra(side,round,validCalculation){
 return bossCharacterActive(side,round)?.effect==='sync'&&validCalculation?5:0;
}
export function bossCharacterCounterSync(side,round,actualCounter){
 return bossCharacterActive(side,round)?.effect==='counter'&&actualCounter?8:0;
}
export function bossCharacterRememberHit(side,round,actualDamage){
 if(!(actualDamage>0)||bossCharacterActive(side,round)?.effect!=='regeneration'||
  side.bossCharacter.regenerated||round>=side.bossCharacter.untilRound)return false;
 // Queue one repair for following cycle, never a free heal on this hit.
 side.bossCharacter.regenDue=round+1;
 return true;
}
export function bossCharacterApplyRegen(side,round,terrainEffects=null){
 const state=side?.bossCharacter;
 if(bossCharacterActive(side,round)?.effect!=='regeneration'||
  state.regenDue!==round||state.regenerated||
  side.defense.parts.shieldGenerator.hp<=0)return 0;
 // Ripara con la stessa fisica delle altre Carte Speciali: il generatore
 // danneggiato dimezza la cura e il rialzo della barriera richiude i vitali
 // che non devono più essere esposti. Mai mutare shield.hp direttamente.
 const poisoned=exclusiveNeurotoxinActive(side,round);
 const adjusted=exclusiveNeurotoxinRepairAmount(side,round,4);
 const repaired=restoreMotherShield(side.defense,pvpTerrainRepairAmount(adjusted,terrainEffects));
 side.defense=repaired.defense;
 if(poisoned&&repaired.repaired>0)clearExclusiveNeurotoxin(side,round);
 state.regenerated=true;state.regenDue=0;
 return repaired.repaired;
}
