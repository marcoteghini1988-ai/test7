import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,advanceOfficialLiveDuel,
 finishOfficialLiveTurn,liveCompatibleShips,supportedLiveSpecial} from './officialLiveDuelEngine.js';
const battle=(a='N00',z='C01',mode='classic')=>
 createOfficialLiveDuel(createTacticalDuel({shipA:a,shipB:z,
  levelA:1,levelB:1,nowMs:0,mode}),0);
const move=(b,side,action,at)=>{const r=applyOfficialLiveAction(b,side,action,at);
 assert.equal(r.ok,true,JSON.stringify({side,action,reason:r.reason}));return r.battle;};

test('Alternanza 30s: nessuno sparo nativo senza carta, nessuna risoluzione simultanea',()=>{
 const b=battle();
 assert.equal(b.phase,'playing');
 assert.equal(b.deadlineMs,30000);
 assert.equal(b.activeSide,'A');
 assert.equal(advanceOfficialLiveDuel(b,29999),b);
 const turnB=advanceOfficialLiveDuel(b,30000);
 assert.equal(turnB.activeSide,'B');
 assert.equal(turnB.sides.A.defense.shield.hp,60);
 assert.equal(turnB.sides.B.defense.shield.hp,60);
 assert.equal(turnB.deadlineMs,60000);
 assert.equal(turnB.history.some(e=>e.kind==='shot'),false);
});
test('Aurora universale leggera: 1 carta spara subito, poi resta massimo 3 numeriche',()=>{
 let b=battle();
 for(const suit of ['♣','♦','♥','♠']){
  assert.equal(liveCompatibleShips(b.sides.A,{suit,value:8})[0].compatible,true);
 }
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},100);
 assert.equal(b.sides.B.defense.shield.hp,59);
 assert.equal(b.sides.A.numeric.hand.length,6);
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.history.at(-1).kind,'shot');
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},200);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},300);
 assert.equal(applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship'},400).reason,'numeric_turn_limit');
 assert.equal(b.sides.A.numeric.hand.length,4);
 const turnB=finishOfficialLiveTurn(b,500),turnA=finishOfficialLiveTurn(turnB,600);
 assert.equal(turnA.sides.A.numeric.hand.length,7);
});
test('Il seme non compatibile non si consuma; 42 armi native restano nel catalogo',()=>{
 const b=battle('C01','N00');
 assert.equal(liveCompatibleShips(b.sides.A,b.sides.A.numeric.hand[0])[0].compatible,false);
 const invalid=applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship'},50);
 assert.equal(invalid.ok,false);
 assert.equal(invalid.reason,'suit_incompatible');
 assert.equal(invalid.battle.sides.A.numeric.hand.length,7);
 const valid=applyOfficialLiveAction(b,'A',{type:'numeric',index:2,target:'ship'},60);
 assert.equal(valid.ok,true);
 assert.equal(valid.battle.history.at(-1).weaponId,'W02');
});
test('Soglia barriera: scegli il vitale, conserva combinazione e distrugge al completamento',()=>{
 let b=battle('N00','C01');
 b.sides.B.defense.shield.hp=45; // stato reale dopo assedio
 assert.equal(b.sides.B.defense.parts.engine.exposed,false);
 b=move(b,'A',{type:'expose',vitalId:'engine'},10);
 assert.equal(b.sides.B.defense.parts.engine.exposed,true);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},20);
 assert.equal(b.vitalBuilds.A.engine.length,1);
 assert.equal(b.sides.B.defense.parts.engine.hp,10);
 b=finishOfficialLiveTurn(b,30);
 b=finishOfficialLiveTurn(b,40);
 assert.equal(b.vitalBuilds.A.engine.length,1);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},50);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.vitalBuilds.A.engine.length,0);
 assert.equal(b.history.at(-2).kind,'vital_destroyed');
});
test('Trappole diverse: entrambe reagiscono allo stesso attacco, nessuna azione nel turno altrui',()=>{
 let b=battle('C01','N00');
 b=move(b,'A',{type:'end'},1);
 b=move(b,'B',{type:'special',index:0,slot:'trap-0'},2);
 b=move(b,'B',{type:'special',index:3,slot:'trap-1'},3);
 assert.equal(b.zones.B.traps[0].type,'tactic-reactive');
 assert.equal(b.zones.B.traps[1].type,'tactic-impact');
 const invalid=applyOfficialLiveAction(b,'A',{type:'numeric',index:2,target:'ship'},4);
 assert.equal(invalid.reason,'not_your_turn');
 b=move(b,'B',{type:'end'},5);
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},6);
 assert.equal(b.zones.B.traps.every(t=>t===null),true);
 assert.equal(b.history.filter(h=>h.kind==='trap').length,2);
 assert.equal(b.sides.B.defense.shield.hp,60);
});
test('Terreno PvP immediato, persistente e sostituibile; boss protetto',()=>{
 let b=battle('N00','C01','pvp');
 b.sides.A.special.hand[0].type='terrain-debris'; // fixture per pescata equipaggiata
 b=move(b,'A',{type:'special',index:0,slot:'terrain'},5);
 assert.equal(b.activeTerrain.id,'terrain-debris');
 assert.ok(b.activeTerrain.untilRound>100);
 b=finishOfficialLiveTurn(b,10);
 assert.equal(b.activeTerrain.id,'terrain-debris');
 b.sides.B.special.hand[0].type='terrain-plasma';
 b=move(b,'B',{type:'special',index:0,slot:'terrain'},20);
 assert.equal(b.activeTerrain.id,'terrain-plasma');
 let boss=battle('N00','C01','campaign');
 boss.sides.B.bossPlanetId=19;
 boss.sides.A.special.hand[0].type='terrain-debris';
 assert.equal(applyOfficialLiveAction(boss,'A',{type:'special',index:0,slot:'terrain'},10).reason,'terrain_pvp_only');
});
test('Due speciali per turno, trappola coperta persistente e nessun effetto fantasma',()=>{
 let b=battle();
 assert.equal(supportedLiveSpecial('tactic-reactive'),true);
 assert.equal(supportedLiveSpecial('epic_item_7'),false);
 b.sides.A.special.hand[0].type='tactic-reactive';
 b.sides.A.special.hand[1].type='tactic-impact';
 b.sides.A.special.hand[2].type='tactic-counter';
 b=move(b,'A',{type:'special',index:0,slot:'trap-0'},1);
 b=move(b,'A',{type:'special',index:0,slot:'trap-1'},2);
 assert.equal(b.actionUsed.special,2);
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'trap-0'},3).reason,'special_turn_limit');
 b=move(b,'A',{type:'end'},4);
 b=move(b,'B',{type:'end'},5);
 assert.equal(b.zones.A.traps.filter(Boolean).length,2);
});


test('Faglia speciale: colpisce vitale protetto dopo vera combinazione, senza aprire la barriera',()=>{
 let b=battle('N00','C01');
 b.sides.A.special.hand[0].type='tactic-vulnerability-rift';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.liveRift,true);
 assert.equal(b.sides.B.defense.parts.engine.exposed,false);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.sides.A.liveRift,false);
 assert.equal(b.sides.A.riftUsed,true);
});
test('Corrosione e Ionico speciali hanno conseguenze reali solo dopo un colpo dannoso',()=>{
 let b=battle('C01','N00');
 b.sides.A.special.hand[0].type='shot-corrosion';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},2); // 5♥ = 10 HP
 assert.equal(b.sides.B.corroded,true);
 const before=b.sides.B.defense.shield.hp;
 b=finishOfficialLiveTurn(b,3);
 b=finishOfficialLiveTurn(b,4);
 const i=b.sides.A.numeric.hand.findIndex(c=>c.suit==='♥');
 assert.ok(i>=0);
 b=move(b,'A',{type:'numeric',index:i,target:'ship'},5);
 assert.equal(b.sides.B.corroded,false);
 assert.ok(b.sides.B.defense.shield.hp<before);
});
