// Eclissi Stellare — ponte del combattimento simultaneo UFFICIALE.
// Sorgenti: collezioni reali; nessuna concessione di carte o livelli di prova.
// Le ricompense restano nel controller MathDuelBattle, una sola volta alla fine.
import {readShipCollection,collectionBattleOptions} from './shipCollection.js';
import {readSpecialCollection} from './specialDeckBuilder.js';
import {prepareMotherDuelOptions} from './motherDuelLoadout.js';
import {createTacticalDuel,validateTacticalLoadout} from './simultaneousDuelEngine.js';
import {newVessel} from './mathDuelEngine.js';
import {VITAL_IDS} from './vitalDefense.js';

const BATTLE_MODES=new Set(['classic','adventure','campaign','pvp']);

// La campagna boss continua a usare le passive e il motore esistenti
// sino a quando tutte le 23 abilita saranno convertite e testate.
// Idem per i mazzi boss equipaggiati: nessuna perdita silenziosa di poteri.
export function officialSimultaneousEligibility({gameMode,sectorNumber=1,
  bossSectorLevel=null,selectedBossDeck='neutral_starter',bossDeckInventory={}}={}){
 if(!BATTLE_MODES.has(gameMode))return {enabled:false,reason:'mode'};
 if(selectedBossDeck!=='neutral_starter'&&bossDeckInventory?.[selectedBossDeck]?.unlocked)
  return {enabled:false,reason:'equipped_boss_passives'};
 const last=Number(bossSectorLevel??((Math.max(1,Number(sectorNumber)||1)-1)%10+1));
 if(['adventure','campaign'].includes(gameMode)&&last===10)
  return {enabled:false,reason:'boss_sector'};
 return {enabled:true,reason:'official_simultaneous'};
}

// Nessuna lettura dei salvataggi avviene nel motore tattico:
// l'unico punto di accesso alle carte equipaggiate e quello ufficiale.
export function createOfficialSimultaneousDuel(props={},nowMs=Date.now(),storage=null){
 const collection=storage?readShipCollection(storage):readShipCollection();
 const specials=storage?readSpecialCollection(storage):readSpecialCollection();
 const chosen=collectionBattleOptions(collection);
 const options=prepareMotherDuelOptions(chosen,{
  mode:props.gameMode,globalSector:props.sectorNumber,
  planetId:props.bossPlanetId,planetSector:props.bossSectorLevel
 });
 const shipA=options.fleetIds[0],shipB=options.enemyFleetIds[0];
 const levelA=options.shipLevels[shipA],levelB=options.enemyShipLevels[shipB];
 if(!validateTacticalLoadout(specials.loadout))
  throw new Error('Il mazzo speciale equipaggiato non e compatibile con il duello simultaneo. Nessun salvataggio e stato modificato.');
 const battle=createTacticalDuel({
  shipA,shipB,levelA,levelB,nowMs,
  specialDeckA:[...specials.loadout]
 });
 return {battle,shipA,shipB,levelA,levelB};
}

// Adattatore SOLO visivo: non modifica gli HP autorevoli e non crea armi.
// I componenti ShipSkin, MountedWeapons ed EscortPods restano quelli originali.
export function officialVisualFleet(side){
 const vessel=newVessel(side.shipId,side.level);
 const engineVital=side.defense.parts.engine;
 const engines=Object.fromEntries(Object.entries(vessel.engines).map(([op,engine])=>
  [op,{...engine,hp:Math.max(0,Math.ceil(engine.max*engineVital.hp/engineVital.max))}]));
 const escorts=side.escorts.map((escort,i)=>({
  id:escort.id,name:'Scudiera '+(i+1),parentShipId:side.shipId,
  weapon:{name:'Armamento integrato',role:'support'},
  defense:{shield:{hp:escort.hp,max:escort.max},destroyed:escort.hp<=0,signature:null}
 }));
 return {fleet:[{...vessel,engines,defense:side.defense}],escorts};
}

export function officialMotherIntegrity(side){
 if(!side?.defense)return 0;
 const {shield,parts}=side.defense;
 const total=shield.hp+VITAL_IDS.reduce((sum,id)=>sum+parts[id].hp,0)+
  side.escorts.reduce((sum,e)=>sum+e.hp,0);
 const maximum=shield.max+VITAL_IDS.reduce((sum,id)=>sum+parts[id].max,0)+
  side.escorts.reduce((sum,e)=>sum+e.max,0);
 return maximum>0?Math.max(0,Math.min(1,total/maximum)):0;
}
