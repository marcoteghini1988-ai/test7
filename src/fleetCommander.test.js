// Punti 40-41: un comandante persistente per flotta, senza passivi Poker legacy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {
 FLEET_COMMANDER_MAX_LEVEL,FLEET_COMMANDER_DEFAULT_ID,
 commanderFromInventory,normalizeFleetCommander,equipFleetCommander
} from './fleetCommander.js';

const rng=()=>.5;
test('40: equipaggia soltanto un comandante realmente sbloccato, da inventario storico',()=>{
 assert.equal(FLEET_COMMANDER_DEFAULT_ID,'pilot_com_1');
 const inventory={pilot_com_1:{unlocked:true,level:3},
  pilot_com_2:{unlocked:false,level:5}};
 assert.deepEqual(commanderFromInventory('pilot_com_1',inventory),
  {id:'pilot_com_1',level:3,scope:'fleet'});
 assert.equal(commanderFromInventory('pilot_com_2',inventory),null);
 assert.equal(commanderFromInventory('pilot_unknown',inventory),null);
 assert.equal(commanderFromInventory('',inventory),null);
 assert.equal(commanderFromInventory('pilot_com_1',null),null);
});
test('40: limiti livello 1-5, nessuna copia o effetto su carte o navicelle',()=>{
 assert.equal(FLEET_COMMANDER_MAX_LEVEL,5);
 for(const [n,expected] of [[1,1],[3,3],[5,5],[9,5],[-10,1],['x',1]]){
  assert.equal(normalizeFleetCommander('pilot_com_1',n).level,expected);
 }
 const ship={fleet:[{id:'N00',engines:{},weapons:[]}],hand:[{id:'h1'}]};
 const attached=equipFleetCommander(ship,'pilot_com_1',4);
 assert.notStrictEqual(attached,ship);
 assert.strictEqual(attached.fleet,ship.fleet);
 assert.strictEqual(attached.hand,ship.hand);
 assert.equal(ship.commander,undefined);
 assert.deepEqual(attached.commander,{id:'pilot_com_1',level:4,scope:'fleet'});
 assert.equal(attached.fleet[0].commander,undefined);
 assert.strictEqual(equipFleetCommander(ship,null,4),ship);
 assert.strictEqual(equipFleetCommander({},'pilot_com_1',1).commander,undefined);
});
test('40: comandante equipaggiato all’avvio di un duello anche con scudiere',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  playerCommanderId:'pilot_com_3',playerCommanderLevel:4,
  enemyCommanderId:'pilot_com_1',enemyCommanderLevel:2},rng);
 assert.equal(b.player.commander.id,'pilot_com_3');
 assert.equal(b.player.commander.level,4);
 assert.equal(b.enemy.commander.id,'pilot_com_1');
 assert.equal(b.enemy.commander.level,2);
 assert.equal(b.player.fleet.length,1);
 assert.equal(b.player.escorts.length,2);
 assert.equal(b.player.fleet[0].commander,undefined);
 assert.ok(b.player.hand.length===7);
 assert.ok(b.player.specialHand.length===5);
});
test('40: il comandante sopravvive a danno localizzato e perdita scudo scudiera',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  playerCommanderId:'pilot_com_1',playerCommanderLevel:5},rng);
 const commander=b.player.commander;
 const result=applyPendingHit(b.player,0,'plus',12,{escortIndex:0,nowMs:1000,
  hitId:'commander-escort-hit'});
 assert.equal(result.damage,12);
 assert.deepEqual(result.defender.commander,commander);
 assert.equal(result.defender.escorts[0].commander,undefined);
 // Even a four-vitals-KO state is still a fleet-level commander assignment.
 const mother=result.defender.fleet[0],defense=mother.defense;
 const knockout={...result.defender,fleet:[{...mother,defense:{...defense,
  parts:Object.fromEntries(Object.entries(defense.parts).map(([id,p])=>[id,{...p,hp:0}]))}}]};
 assert.deepEqual(knockout.commander,commander);
 assert.equal(knockout.fleet[0].commander,undefined);
});
test('40: nessun buff numerico o speciale viene attribuito dalla sola presenza del comandante',()=>{
 const base=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng);
 const withCommander=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  playerCommanderId:'pilot_com_1',playerCommanderLevel:5},rng);
 assert.deepEqual(withCommander.player.fleet,base.player.fleet);
 assert.deepEqual(withCommander.player.escorts,base.player.escorts);
 assert.deepEqual(withCommander.player.hand,base.player.hand);
 assert.deepEqual(withCommander.player.specialHand,base.player.specialHand);
 assert.equal(base.player.commander,undefined);
 assert.equal(withCommander.player.commander.level,5);
});
