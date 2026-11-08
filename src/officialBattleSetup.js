// Ingresso unico al duello simultaneo della campagna: inventari reali, mai carte gratuite.
import {chooseCampaignMotherRival,chooseCampaignRivalCommander} from './motherDuelLoadout.js';
import {commanderFromInventory,normalizeFleetCommander} from './fleetCommander.js';
import {tacticalCommanderReady} from './tacticalCommanders.js';
import {tacticalBossDeckReady} from './tacticalBossDecks.js';
import {numericBossDeck} from './bossNumericDecks.js';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,validateTacticalLoadout} from './simultaneousDuelEngine.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {validateSpecialDeck} from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {arenaForBattle} from './battleArenas.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {TACTICAL_EPIC_CARDS,isTacticalEpic} from './tacticalEpicCards.js';

export function officialBattleSetup({
 mode='campaign',sectorNumber=1,bossPlanetId=null,bossSectorLevel=null,
 shipCollection,specialCollection,selectedPilot=null,pilotInventory={},
 selectedBossDeck='neutral_starter',bossDeckInventory={},pilotLevel=1,
 epicRiftOpened=false,nowMs=0,seed=18
}={}){
 if(!shipCollection?.cards||!Array.isArray(shipCollection.loadout))
  throw new Error('Collezione navicelle non leggibile: salvataggio conservato');
 const equipped=shipCollection.cards.find(c=>c.instanceId===shipCollection.loadout[0]);
 if(!equipped||typeof equipped.shipId!=='string'||!Number.isInteger(equipped.level))
  throw new Error('La navicella madre equipaggiata non è valida');
 if(!specialCollection||!validateSpecialDeck(specialCollection,specialCollection.loadout).valid)
  throw new Error('Mazzo speciale non valido: nessun salvataggio modificato');
 // Il mazzo della collezione reale deve essere anche supportato dal motore
 // simultaneo. In presenza di carte non ancora convertite fermarsi, non sostituirle.
 const battleSpecialDeck=combatSpecialLoadout(specialCollection,mode);
 if(!validateTacticalLoadout(battleSpecialDeck))
  throw new Error('Una carta speciale equipaggiata non è ancora compatibile con il nuovo duello');
 // Gli slot originali sono 0 prima della soglia, 1 a L20 o al primo
 // Varco fuso e 2 a L60. L'IA non riceve gli Epici del giocatore.
 const epicSlots=pilotLevel>=60?2:pilotLevel>=20||epicRiftOpened?1:0;
 const equippedEpics=battleSpecialDeck.filter(isTacticalEpic);
 if(equippedEpics.length>epicSlots)
  throw new Error('Slot Epici non ancora sbloccati dal livello pilota o dai Varchi');
 if(equippedEpics.some(id=>(specialCollection.owned?.[id]??0)<1))
  throw new Error('Oggetto Epico nel mazzo ma non ancora ottenuto');
 const epicEntitlements=Object.keys(TACTICAL_EPIC_CARDS).filter(id=>
  (specialCollection.owned?.[id]??0)>=1);
 // I mazzi numerici boss non fanno parte delle 24 speciali.
 // Attiva soltanto i mazzi le cui passive sono convertite, se posseduti ed equipaggiati.
 let ownedBossDeck=null;
 if(selectedBossDeck&&selectedBossDeck!=='neutral_starter'){
  const owned=bossDeckInventory?.[selectedBossDeck];
  const definition=numericBossDeck(selectedBossDeck);
  if(!tacticalBossDeckReady(selectedBossDeck)||!definition||owned?.unlocked!==true)
   throw new Error('Mazzo boss non sbloccato o ancora non convertito: nessuna carta concessa');
  const level=Math.max(1,Math.min(definition.maxLevel,Math.floor(Number(owned.level)||1)));
  ownedBossDeck={id:selectedBossDeck,level};
 }
 const boss=officialBossEncounter({mode,sectorNumber,
  planetId:bossPlanetId,sectorLevel:bossSectorLevel});
 const encounterPlanet=boss?.planetId??bossPlanetId;
 const rival=chooseCampaignMotherRival(equipped.shipId,equipped.level,sectorNumber,encounterPlanet,bossSectorLevel);
 const arena=arenaForBattle(sectorNumber,mode,null,{planetId:encounterPlanet,
  sectorLevel:bossSectorLevel});
 // L'ID del giocatore deve essere sbloccato nell'inventario persistente.
 // L'IA usa la scelta ufficiale del comandante avversario, mai carte del giocatore.
 const ownedPilot=commanderFromInventory(selectedPilot,pilotInventory);
 if(ownedPilot&&!tacticalCommanderReady(ownedPilot.id))
  throw new Error('Pilota equipaggiato non ancora convertito: usare il duello 3D compatibile');
 const rivalPilot=chooseCampaignRivalCommander({
  mode,globalSector:sectorNumber,planetId:encounterPlanet,planetSector:bossSectorLevel,
  shipId:rival.shipId,shipLevel:rival.level
 });
 const enemyPilot=tacticalCommanderReady(rivalPilot.id)?
  normalizeFleetCommander(rivalPilot.id,rivalPilot.level):null;
 const opponentDeck=boss?buildTacticalBossDeck(boss.planetId,rival.level,equipped.level):[...TACTICAL_STARTER_TYPES];
 const options={
  shipA:equipped.shipId,levelA:equipped.level,
  shipB:rival.shipId,levelB:rival.level,
  seed,nowMs,mode,arenaId:arena.id,shuffleNumericOpening:true,
  commanderA:ownedPilot,commanderB:enemyPilot,
  bossNumericDeckA:ownedBossDeck,
  bossNumericDeckB:boss?{id:boss.numericDeckId,level:boss.numericDeckLevel}:null,
  specialDeckA:battleSpecialDeck,epicEntitlementsA:epicEntitlements,
  specialDeckB:opponentDeck,bossPlanetB:boss?.planetId??null
 };
 return {
  battle:createTacticalDuel(options),
  shipA:equipped.shipId,shipB:rival.shipId,
  bossId:boss?.planetId??null,bossEncounter:boss,arena,mode
 };
}

export function officialBattleResult(battle,mode,sectorNumber){
 if(!battle||battle.phase!=='finished')throw new Error('Scontro non ancora concluso');
 const side=battle.sides.A;
 const parts=Object.values(side.defense.parts);
 const max=side.defense.shield.max+parts.reduce((sum,p)=>sum+p.max,0);
 const current=side.defense.shield.hp+parts.reduce((sum,p)=>sum+p.hp,0);
 const health=max?current/max:0;
 const winner=battle.winner==='A'?'player':battle.winner==='B'?'enemy':'draw';
 return {
  winner,eligibleForRewards:winner==='player'&&['adventure','campaign'].includes(mode),
  meta:{
   turnsElapsed:battle.round,
   remainingHpPct:health,
   starsEarned:[winner==='player',winner==='player'&&health>=.65,winner==='player'&&health>=.9],
   matchStats:{
    turnsElapsed:battle.round,damageDealt:Math.round(
     (1-battle.sides.B.defense.shield.hp/battle.sides.B.defense.shield.max)*100),
    simultaneousDuel:true,sectorNumber
   }
  }
 };
}
