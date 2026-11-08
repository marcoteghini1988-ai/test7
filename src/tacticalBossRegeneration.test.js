import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {damageMotherShield,exposeMotherPart} from './vitalDefense.js';
import {activateBossCharacter,bossCharacterApplyRegen}
 from './bossCharacterCards.js';

function setUp(regeneratorHp=10){
 const side=createTacticalDuel().sides.A;
 const activated=activateBossCharacter(side,'boss-character-11',1);
 assert.equal(activated.ok,true);
 side.defense=damageMotherShield(side.defense,33).defense;
 side.defense=exposeMotherPart(side.defense,'weapons').defense;
 assert.equal(side.defense.shield.hp,27);
 assert.equal(side.defense.parts.weapons.exposed,true);
 side.defense.parts.shieldGenerator.hp=regeneratorHp;
 side.bossCharacter.regenDue=2;
 return side;
}

test('Carta Personaggio Idra: quando ripristina la barriera, richiude il vitale protetto',()=>{
 const side=setUp();
 const actual=bossCharacterApplyRegen(side,2);
 assert.equal(actual,4);
 assert.equal(side.defense.shield.hp,31);
 assert.equal(side.defense.parts.weapons.exposed,false);
 assert.deepEqual(side.defense.exposureOrder,[]);
 assert.equal(side.bossCharacter.regenerated,true);
 assert.equal(bossCharacterApplyRegen(side,2),0,'mai due cure con una sola Carta Personaggio');
});

test('Carta Idra + Faglia sul Generatore: fino al ripristino il danno dimezza la cura',()=>{
 const side=setUp(5);
 const healed=bossCharacterApplyRegen(side,2);
 assert.equal(healed,2,'4 nominali diventano 2 HP reali con generatore a metà');
 assert.equal(side.defense.shield.hp,29);
 assert.equal(side.defense.parts.weapons.exposed,true,'scudo ancora sotto soglia: vitale ancora esposto');
 assert.equal(side.bossCharacter.regenerated,true);
});

test('Carta Idra: non ripara senza generatore né dopo scadenza, nessun bonus passivo',()=>{
 const noCard=createTacticalDuel().sides.A;
 noCard.defense=damageMotherShield(noCard.defense,33).defense;
 assert.equal(bossCharacterApplyRegen(noCard,2),0);
 const destroyed=setUp(0);
 assert.equal(bossCharacterApplyRegen(destroyed,2),0);
 assert.equal(destroyed.defense.shield.hp,27);
 const expired=setUp();
 assert.equal(bossCharacterApplyRegen(expired,3),0);
 assert.equal(expired.defense.shield.hp,27);
});
