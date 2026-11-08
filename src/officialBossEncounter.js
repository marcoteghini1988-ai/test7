// Preserves the 12 official campaign boss identities and the numeric
// boss deck they actually used in the historical 3D battle. No extra unlocks.
// This resolver is read-only and never edits progression or inventory.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {tacticalBossProfile} from './tacticalSpecialPresets.js';
import {tacticalBossDeckReady} from './tacticalBossDecks.js';
import {numericBossDeck} from './bossNumericDecks.js';
import {battleArena} from './battleArenas.js';
import {exclusiveBossReady} from './tacticalExclusiveBosses.js';

export function officialBossEncounter({mode='campaign',sectorNumber=1,planetId=null,sectorLevel=null}={}){
 if(!['campaign','adventure'].includes(mode))return null;
 const global=Number(sectorNumber);
 if(!Number.isInteger(global)||global<1)return null;
 const local=sectorLevel==null?((global-1)%10)+1:Number(sectorLevel);
 if(local!==10)return null;
 // Campaign uses global sectors 10,20,...120; Adventure's local routing
 // must provide the explicit planet, otherwise the old boss battle is safer.
 if(mode==='campaign'&&((global-1)%10)+1!==10)return null;
 const selected=planetId==null?null:PHASE16A_CAMPAIGN_PLANETS.find(x=>x.id===Number(planetId));
 const fromGlobal=PHASE16A_CAMPAIGN_PLANETS[Math.floor((global-1)/10)]??null;
 // Anche in Avventura l'ID storico del pianeta deve corrispondere
 // al settore canonico 10,20,...120: non basta dichiarare livello 10.
 if(mode==='adventure'&&(!selected||
    global!==PHASE16A_CAMPAIGN_PLANETS.findIndex(p=>p.id===selected.id)*10+10))return null;
 if(mode==='campaign'&&selected&&selected.id!==fromGlobal?.id)return null;
 const planet=selected??fromGlobal;
 if(!planet)return null;
 const profile=tacticalBossProfile(planet.id);
 const deck=numericBossDeck(planet.deck);
 const arena=battleArena('boss_'+planet.id);
 if(!profile||!deck||!exclusiveBossReady(planet.id)||!tacticalBossDeckReady(planet.deck)||
   arena.kind!=='boss')return null;
 // Identical historic difficulty grade from BossBattle3D.bossChoices:
 // no direct gift of the level 9 deck even for the last planet.
 const level=Math.min(deck.maxLevel,Math.max(1,1+Math.floor((global-1)/20)));
 return Object.freeze({
  planetId:planet.id,planetName:planet.name,name:profile.name,
  exclusiveAbility:profile.ability,numericDeckId:deck.id,
  numericDeckLevel:level,arenaId:arena.id,globalSector:global,
  planetSector:10,profile
 });
}
