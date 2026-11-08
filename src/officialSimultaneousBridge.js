// Eclissi Stellare — ponte del combattimento simultaneo UFFICIALE.
// Sorgenti: collezioni reali; nessuna concessione di carte o livelli di prova.
// Le ricompense restano nel controller MathDuelBattle, una sola volta alla fine.
import {readShipCollection} from './shipCollection.js';
import {readSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {newVessel} from './mathDuelEngine.js';
import {VITAL_IDS} from './vitalDefense.js';
import {tacticalCommanderReady} from './tacticalCommanders.js';
import {tacticalBossDeckReady} from './tacticalBossDecks.js';
import {officialBossEncounter} from './officialBossEncounter.js';

const BATTLE_MODES=new Set(['classic','adventure','campaign','pvp']);

// Le 23 passive numeriche, i 12 poteri esclusivi, le arene boss e i
// mazzi boss nemici sono ora verificati nel motore simultaneo.
// I boss riconosciuti passano alla plancia 3D già ufficiale; per salvataggi
// con settore o pianeta incoerente rimane il motore storico BossBattle3D.
// Il cambio non modifica la collezione, la progressione o le ricompense.
export function officialSimultaneousEligibility({gameMode,sectorNumber=1,
  bossPlanetId=null,bossSectorLevel=null,selectedBossDeck='neutral_starter',
  bossDeckInventory={},selectedPilot='pilot_com_1'}={}){
 if(!BATTLE_MODES.has(gameMode))return {enabled:false,reason:'mode'};
 // Una carta boss equipaggiata resta attiva, anche con inventari vecchi.
 if(selectedBossDeck&&selectedBossDeck!=='neutral_starter'&&
   (!tacticalBossDeckReady(selectedBossDeck)||
    bossDeckInventory?.[selectedBossDeck]?.unlocked!==true))
  return {enabled:false,reason:'equipped_boss_passives'};
 // Le abilita non basiche dei piloti vengono conservate finche convertite.
 if(selectedPilot&&!tacticalCommanderReady(selectedPilot))
  return {enabled:false,reason:'commander_abilities_pending'};
 const last=Number(bossSectorLevel??((Math.max(1,Number(sectorNumber)||1)-1)%10+1));
 if(['adventure','campaign'].includes(gameMode)&&last===10){
  const encounter=officialBossEncounter({mode:gameMode,sectorNumber,
   planetId:bossPlanetId,sectorLevel:bossSectorLevel});
  // An inconsistent or unsupported historical save stays on BossBattle3D,
  // never silently replacing the boss with a generic enemy.
  if(!encounter)return {enabled:false,reason:'boss_sector'};
  return {enabled:true,reason:'boss_simultaneous',bossId:encounter.planetId};
 }
 // Durate Ionizzazione/Corrosione e fattori dell'arena ionica ora sono
 // risolti dal tempo di combattimento e dalle passive originali.
 return {enabled:true,reason:'official_simultaneous'};
}

// Unico creatore ufficiale: i controlli e il gioco passano dalla STESSA
// validazione di collezioni, boss, piloti e ambienti. Non esiste un secondo
// combattimento con regole diverse. Questo adattatore non scrive salvataggi.
export function createOfficialSimultaneousDuel(props={},nowMs=Date.now(),storage=null){
 const shipCollection=storage?readShipCollection(storage):readShipCollection();
 const specialCollection=storage?readSpecialCollection(storage):readSpecialCollection();
 const setup=officialBattleSetup({
  mode:props.gameMode??'campaign',sectorNumber:props.sectorNumber,
  bossPlanetId:props.bossPlanetId,bossSectorLevel:props.bossSectorLevel,
  selectedPilot:props.selectedPilot,pilotInventory:props.pilotInventory,
  selectedBossDeck:props.selectedBossDeck,bossDeckInventory:props.bossDeckInventory,
  pilotLevel:props.pilotLevel,epicRiftOpened:props.epicRiftOpened,
  shipCollection,specialCollection,nowMs,seed:props.seed??18
 });
 return {...setup,levelA:setup.battle.sides.A.level,levelB:setup.battle.sides.B.level};
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
  weapon:escort.weapon??{name:'Armamento integrato',role:'support'},
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
