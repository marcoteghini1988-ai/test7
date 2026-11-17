import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_SHIP_ORDER,NEXT_COMMON_CARDS,card} from './fleetNext/rules.js';
import {createFleetNextBattle,autoFleetTurn,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';

test('Duelli HP: dodici madri di campagna, pescaggio e turni IA senza errori',()=>{
 const owned=Object.fromEntries([...NEXT_COMMON_CARDS.map(c=>c.id),
  'prog-machine-striker','prog-machine-guard','gen-216'].map(id=>[id,1]));
 for(const [index,shipId] of CAMPAIGN_SHIP_ORDER.entries()){
  const deck=buildNextBaseDeck({owned},shipId,5);
  assert.ok(deck.total<=40,shipId);
  const started=createFleetNextBattle({
   shipA:shipId,shipB:shipId,levelA:5,levelB:5,
   deckA:deck.baseDeck,deckB:['gen-216'],
   seed:42+index,mode:'pvp',ruleset:HP_SYNC_RULESET
  });
  assert.equal(started.ruleset,HP_SYNC_RULESET);
  assert.ok([...started.sides.A.hand,...started.sides.A.deck].some(id=>id.startsWith('sys-')),shipId);
  let battle=started;
  for(let turn=0;turn<12&&battle.phase==='playing';turn++){
   const who=battle.turn,order=autoFleetTurn(battle,who);
   const result=resolveFleetNextTurn(battle,who,order,1000+turn*30000);
   assert.equal(result.ok,true,shipId+' turno '+turn+': '+result.reason);
   battle=result.battle;
   assert.ok(battle.sides.A.ships[0].hp>=0&&battle.sides.B.ships[0].hp>=0,shipId);
   assert.ok(battle.sides.A.hand.length<=7&&battle.sides.B.hand.length<=7,shipId);
   assert.ok(!battle.sides.A.machines.some(x=>x.untilPly!=null&&x.untilPly<=battle.ply),shipId);
  }
  assert.ok(battle.ply>=1,shipId+' ha effettuato turni');
 }
});
