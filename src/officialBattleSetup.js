// Ingresso unico al duello simultaneo della campagna: inventari reali, mai carte gratuite.
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,validateTacticalLoadout} from './simultaneousDuelEngine.js';
import {buildTacticalBossDeck,tacticalBossProfile} from './tacticalSpecialPresets.js';
import {validateSpecialDeck} from './specialDeckBuilder.js';
import {arenaForBattle} from './battleArenas.js';

export function officialBattleSetup({
 mode='campaign',sectorNumber=1,bossPlanetId=null,bossSectorLevel=null,
 shipCollection,specialCollection,nowMs=0,seed=18
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
 if(!validateTacticalLoadout(specialCollection.loadout))
  throw new Error('Una carta speciale equipaggiata non è ancora compatibile con il nuovo duello');
 const rival=chooseCampaignMotherRival(equipped.shipId,equipped.level,sectorNumber,bossPlanetId,bossSectorLevel);
 const arena=arenaForBattle(sectorNumber,mode,null,{planetId:bossPlanetId,sectorLevel:bossSectorLevel});
 const local=Number(bossSectorLevel)||((Math.max(1,Number(sectorNumber)||1)-1)%10+1);
 const boss=mode!=='pvp'&&local===10&&tacticalBossProfile(bossPlanetId);
 const opponentDeck=boss?buildTacticalBossDeck(bossPlanetId,rival.level,equipped.level):[...TACTICAL_STARTER_TYPES];
 const options={
  shipA:equipped.shipId,levelA:equipped.level,
  shipB:rival.shipId,levelB:rival.level,
  seed,nowMs,arenaId:arena.id,shuffleNumericOpening:true,specialDeckA:[...specialCollection.loadout],
  specialDeckB:opponentDeck,bossPlanetB:boss?Number(bossPlanetId):null
 };
 return {
  battle:createTacticalDuel(options),
  shipA:equipped.shipId,shipB:rival.shipId,
  bossId:boss?Number(bossPlanetId):null,arena,mode
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
