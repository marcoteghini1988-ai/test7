import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS,PHASE16A_RIFTS} from './newCombat/phase16ACatalog.js';
import {applyVerifiedBossRelic,verifiedBossRelicReward} from './campaignBossRelics.js';

function victory(p,i,mode='adventure'){
 return {winner:'player',mode,sectorNumber:(i+1)*10,
  bossPlanetId:p.id,bossSectorLevel:10};
}
test('12 reliquie storiche assegnate una volta dopo il boss canonico, anche dopo riapertura',()=>{
 let saved='{}',prev={};
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const result=applyVerifiedBossRelic(JSON.parse(saved),victory(planet,i));
  assert.equal(result.granted,true,planet.name);
  assert.equal(result.relicId,planet.relic);
  assert.equal(result.relics[planet.relic],true);
  assert.deepEqual(JSON.parse(saved),prev,'Nessuna scrittura indiretta');
  saved=JSON.stringify(result.relics);
  prev=JSON.parse(saved);
  assert.equal(applyVerifiedBossRelic(prev,victory(planet,i)).granted,false);
  assert.equal(applyVerifiedBossRelic(prev,victory(planet,i,'campaign')).granted,false,
   'Campagna e Avventura condividono la stessa reliquia');
 }
 const restored=JSON.parse(saved);
 assert.equal(Object.keys(restored).filter(k=>k.startsWith('relic_p')).length,12);
 for(const rift of PHASE16A_RIFTS){
  assert.ok(rift.relicsRequired.every(key=>restored[key]===true),
   'Le sei fusioni hanno tutte e due le reliquie autentiche');
 }
 const extra={...restored,legacy_event:{unlocked:true}};
 assert.deepEqual(applyVerifiedBossRelic(extra,victory(PHASE16A_CAMPAIGN_PLANETS[0],0)).relics,
  extra,'Non cancellare campi di vecchi salvataggi');
});
test('Sconfitte, pareggi, PvP, settori incoerenti e pianeti ignoti non assegnano reliquie',()=>{
 const original={relic_p1:false,legacy:'keep'};
 const p=PHASE16A_CAMPAIGN_PLANETS[0];
 const winner=victory(p,0);
 const invalid=[
  {...winner,winner:'enemy'}, {...winner,winner:'draw'},
  {...winner,mode:'pvp'}, {...winner,sectorNumber:9},
  {...winner,sectorNumber:20}, {...winner,bossSectorLevel:9},
  {...winner,bossPlanetId:2}, {...winner,bossPlanetId:4},
  {...winner,sectorNumber:0}, {...winner,winner:null}
 ];
 for(const x of invalid){
  assert.equal(verifiedBossRelicReward(x),null,JSON.stringify(x));
  const result=applyVerifiedBossRelic(original,x);
  assert.equal(result.granted,false);
  assert.equal(result.relics,original,'Nessuna mutazione o nuova mappa');
 }
 assert.throws(()=>applyVerifiedBossRelic(null,winner),/Salvataggio reliquie/);
 assert.throws(()=>applyVerifiedBossRelic([],winner),/Salvataggio reliquie/);
});
