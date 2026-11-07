import test from 'node:test';
import assert from 'node:assert/strict';
import {tacticalCommanderReady,tacticalCommanderVolleyBonus} from './tacticalCommanders.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {createSpecialCollection} from './specialDeckBuilder.js';

const pilotFixture=[
 ['pilot_com_1','R04','shieldGenerator','plus',[1,2]], // 4 + 5 = 9
 ['pilot_com_2','R04','weapons','minus',[4,1]],        // 7 - 4 = 3
 ['pilot_com_3','C01','engine','times',[0,1]],         // 3 x 4 = 12
 ['pilot_com_4','C02','weapons','divide',[3,1]]        // 8 / 4 = 2
];
const plan=(shipB,pilotId,level=5)=>createTacticalDuel({
 shipA:'C01',shipB,levelA:5,levelB:3,seed:18,nowMs:0,
 commanderA:pilotId?{id:pilotId,level}:null
});
const validOrder=(vitalId,op,numericIndices)=>({
 numericIndices,specialIndices:[],vitalId,op,exchangeIndices:[]
});
function resolve(b,order){
 const first=sealTacticalOrder(b,'A',order,101);
 assert.equal(first.ok,true);
 const second=sealTacticalOrder(first.battle,'B',{specialIndices:[],numericIndices:[]},102);
 assert.equal(second.ok,true);
 return advanceTacticalDuel(second.battle,102);
}
test('solo i quattro piloti comuni sono migrati: gli altri preservano il vecchio combattimento',()=>{
 for(const [id] of pilotFixture){
  assert.equal(tacticalCommanderReady(id),true);
  assert.equal(officialSimultaneousEligibility({gameMode:'classic',selectedPilot:id}).enabled,true);
 }
 assert.equal(officialSimultaneousEligibility({
  gameMode:'classic',selectedPilot:'pilot_boss_1'}).enabled,false);
 assert.equal(tacticalCommanderReady('pilot_leg_1'),false);
});
test('nessun bonus su ordini mancanti, combinazioni invalide o vitali distrutti',()=>{
 const b=plan('R04','pilot_com_1');
 const a=b.sides.A,enemy=b.sides.B,base=nativeBarrierPacket(a);
 assert.equal(tacticalCommanderVolleyBonus(a,enemy,{},base).active,false);
 assert.equal(tacticalCommanderVolleyBonus(a,enemy,validOrder('shieldGenerator','minus',[1,2]),base).extra,0);
 assert.equal(tacticalCommanderVolleyBonus(a,enemy,validOrder('shieldGenerator','plus',[0,1]),base).active,false);
 assert.equal(tacticalCommanderVolleyBonus(a,{
  ...enemy,defense:{...enemy.defense,parts:{...enemy.defense.parts,
   shieldGenerator:{...enemy.defense.parts.shieldGenerator,hp:0}}}
 },validOrder('shieldGenerator','plus',[1,2]),base).active,false);
});
test('quattro operazioni corrette: bonus percentuale sul danno autentico delle armi',()=>{
 for(const [id,shipB,vitalId,op,indices] of pilotFixture){
  const battle=plan(shipB,id);
  const base=nativeBarrierPacket(battle.sides.A);
  const selected=validOrder(vitalId,op,indices);
  const bonus=tacticalCommanderVolleyBonus(battle.sides.A,battle.sides.B,selected,base);
  assert.equal(bonus.active,true,id);
  assert.equal(bonus.percentage,6,id);
  assert.equal(bonus.extra,Math.floor(base*6/100),id);
  assert.equal(bonus.remainder,base*6%100,id);
  const original=structuredClone(battle);
  const powered=resolve(battle,selected);
  const ordinary=resolve(plan(shipB,null),selected);
  const poweredHit=powered.history.at(-1).impacts.find(x=>x.kind==='barrier'&&x.by==='A');
  const normalHit=ordinary.history.at(-1).impacts.find(x=>x.kind==='barrier'&&x.by==='A');
  assert.equal(poweredHit.pilotBonus,bonus.extra,id);
  assert.equal(poweredHit.packet-normalHit.packet,bonus.extra,id);
  assert.equal(powered.sides.A.commander.bonusRemainder,bonus.remainder,id);
  assert.deepEqual(battle,original,'il motore non altera lo stato iniziale');
 }
});
test('il resto percentuale viene conservato nei cicli senza arrotondamenti gratuiti',()=>{
 const battle=plan('R04','pilot_com_1',1);
 const base=nativeBarrierPacket(battle.sides.A);
 const order=validOrder('shieldGenerator','plus',[1,2]);
 const first=tacticalCommanderVolleyBonus(battle.sides.A,battle.sides.B,order,base);
 assert.equal(first.percentage,2);
 assert.equal(first.extra,Math.floor(base*2/100));
 const next={...battle.sides.A,commander:{
  ...battle.sides.A.commander,bonusRemainder:first.remainder}};
 const second=tacticalCommanderVolleyBonus(next,battle.sides.B,order,base);
 assert.equal(first.extra+second.extra,Math.floor(base*4/100));
 assert.equal(second.remainder,base*4%100);
});
test('solo un pilota effettivamente sbloccato viene equipaggiato in campagna',()=>{
 const shipCollection={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],
  loadout:['ship:N00']};
 const specialCollection=createSpecialCollection();
 const base={mode:'campaign',sectorNumber:1,shipCollection,specialCollection,
  selectedPilot:'pilot_com_2',seed:231,nowMs:100};
 const locked=officialBattleSetup({...base,pilotInventory:{}});
 assert.equal(locked.battle.sides.A.commander,null);
 const owned=officialBattleSetup({...base,pilotInventory:{
  pilot_com_2:{unlocked:true,level:4}
 }});
 assert.deepEqual(owned.battle.sides.A.commander,{
  id:'pilot_com_2',level:4,bonusRemainder:0
 });
 assert.equal(owned.battle.sides.B.commander?.id?.startsWith('pilot_com_'),true);
 assert.deepEqual(owned.battle.sides.A.special.hand.concat(owned.battle.sides.A.special.deck)
  .map(c=>c.type).sort(),specialCollection.loadout.slice().sort());
});
