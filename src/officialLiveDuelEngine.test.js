import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
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
 assert.equal(b.sides.B.defense.shield.hp,57);
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
 assert.equal(supportedLiveSpecial('epic_item_7'),true);
 assert.equal(supportedLiveSpecial('epic_item_9'),false);
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
 assert.equal(b.sides.B.defense.parts.engine.hp,5);
 assert.equal(b.sides.B.defense.parts.engine.exposed,false);
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.history.at(-1).kind,'vital_hit');
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

test('Accumulo: prima carica non spara, la soglia usa soltanto numeriche vere',()=>{
 let b=battle('C02','N00');
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:7,suit:'♦'};
 b.sides.A.numeric.hand[1]={...b.sides.A.numeric.hand[1],value:5,suit:'♦'};
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},1);
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.history.at(-1).kind,'weapon_charge');
 assert.equal(b.sides.A.liveWeaponCharges.W03.values[0],7);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.A.liveWeaponCharges.W03,undefined);
 assert.equal(b.sides.B.defense.shield.hp,24); // (7 + 5) x W03 danno 3
 assert.equal(b.history.at(-1).kind,'shot');
});
test('Combo simultanea: seme S carica W11, seme C la completa nello stesso turno',()=>{
 let b=battle('R02','N00');
 b=move(b,'A',{type:'numeric',index:4,target:'ship'},1); // 7♠: W11
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.sides.A.liveWeaponCharges.W11.suits[0],'S');
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2); // 3♣: priorità W11
 assert.equal(b.history.at(-1).weaponId,'W11');
 assert.equal(b.sides.A.liveWeaponCharges.W11,undefined);
 assert.equal(b.sides.B.defense.shield.hp,20); // (7+3) x 4
});
test('Combo a memoria: W42 conserva semi tra turni propri e richiede quattro carte',()=>{
 let b=battle('L04','N00');
 b=move(b,'A',{type:'numeric',index:4,target:'ship'},1); // 7♠
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},2); // 5♥
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},3); // 8♦
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.sides.A.liveWeaponCharges.W42.suits.length,3);
 b=finishOfficialLiveTurn(b,4);
 b=finishOfficialLiveTurn(b,5);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},6); // 3♣
 assert.equal(b.history.at(-1).weaponId,'W42');
 assert.equal(b.sides.A.liveWeaponCharges.W42,undefined);
 assert.equal(b.sides.B.defense.shield.hp,0);
});

test('Poker reale da quattro carte: slot persistenti e completamento in due turni',()=>{
 let b=battle('N00','C01');
 b.sides.B.defense.shield.hp=45;
 b.sides.B.defense.parts.engine.signature={kind:'poker',pattern:'fourKind'};
 b=move(b,'A',{type:'expose',vitalId:'engine'},1);
 for(const suit of ['♣','♦','♥']){
  b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:9,suit};
  b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 }
 assert.equal(b.vitalBuilds.A.engine.length,3);
 assert.equal(b.sides.B.defense.parts.engine.hp,10);
 b=finishOfficialLiveTurn(b,10);
 b=finishOfficialLiveTurn(b,20);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:9,suit:'♠'};
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},30);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.vitalBuilds.A.engine.length,0);
 assert.equal(b.history.at(-2).kind,'vital_destroyed');
});


test('Le cinque Speciali storiche sono giocabili soltanto con la loro carta',()=>{
 for(const type of ['tactic-quantum-dice','tactic-bomb','tactic-malus','tactic-golden','tactic-signature-mutation'])
  assert.equal(supportedLiveSpecial(type),true,type);
 let b=battle();
 b.sides.A.special.hand[0].type='tactic-malus';
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0',malusChoice:'lock_weapon'},1).reason,'malus_not_ready');
 assert.equal(b.sides.A.special.hand.length,5);
 assert.equal(b.actionUsed.special,0);
});
test('Dorata ♦: trasforma una numerica reale e aggiunge Sincronia solo a firma completata',()=>{
 let b=battle('N00','C01');
 b.sides.B.defense.shield.hp=45;
 b.sides.A.special.hand[0].type='tactic-golden';
 b=move(b,'A',{type:'special',index:0,slot:'open-0',goldenIndex:3},1); // 8♦
 assert.equal(b.sides.A.legacy.golden.cardId,b.sides.A.numeric.hand[3].id);
 b=move(b,'A',{type:'expose',vitalId:'weapons'},2); // C01 firma -3
 b=move(b,'A',{type:'numeric',index:3,target:'vital',vitalId:'weapons'},3);
 assert.equal(b.sides.A.sync,0);
 b=move(b,'A',{type:'numeric',index:2,target:'vital',vitalId:'weapons'},4); // 5♥
 assert.equal(b.sides.B.defense.parts.weapons.hp,0);
 assert.equal(b.sides.A.legacy.golden,null);
 assert.equal(b.sides.A.sync,33); // 25 per vitale + 8 Dorata
 assert.ok(b.history.some(e=>e.kind==='golden'));
});
test('Numero Bomba marca solo la carta nemica dopo la pesca e scoppia se usata per sparare',()=>{
 let b=battle('N00','N00');
 b.sides.A.special.hand[0].type='tactic-bomb';
 b=move(b,'A',{type:'special',index:0,slot:'open-0',bombSlot:0},1);
 assert.equal(b.sides.B.legacy.bomb,null);
 b=move(b,'A',{type:'end'},2);
 const cardId=b.sides.B.numeric.hand[0].id;
 assert.equal(b.sides.B.legacy.bomb.cardId,cardId);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.B.defense.shield.hp,52);
 assert.equal(b.sides.B.legacy.bomb,null);
 assert.ok(b.history.some(e=>e.kind==='bomb_explosion'));
});
test('Ricambio Numerico elimina la bomba senza creare numeriche e mantiene sette carte',()=>{
 let b=battle('N00','N00');
 b.sides.A.special.hand[0].type='tactic-bomb';
 b=move(b,'A',{type:'special',index:0,slot:'open-0',bombSlot:0},1);
 b=move(b,'A',{type:'end'},2);
 b.sides.B.special.hand[0].type='tactic-numeric-recycle';
 const marked=b.sides.B.legacy.bomb.cardId;
 b=move(b,'B',{type:'special',index:0,slot:'open-0',recycleIndices:[0]},3);
 assert.equal(b.sides.B.legacy.bomb,null);
 assert.equal(b.sides.B.numeric.hand.length,7);
 assert.equal(b.sides.B.numeric.hand.some(c=>c.id===marked),false);
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.ok(b.history.some(e=>e.kind==='bomb_disarmed'));
});
test('Malus richiede tre colpi validi: -15% soltanto sul turno nativo avversario',()=>{
 let b=battle('N00','N00');
 b.sides.A.special.hand[0].type='tactic-malus';
 b.sides.A.legacy.malusCharge=3; // situazione dopo tre colpi validi
 b=move(b,'A',{type:'special',index:0,slot:'open-0',malusChoice:'lock_weapon'},1);
 assert.equal(b.sides.A.legacy.malusCharge,0);
 b=move(b,'A',{type:'end'},2);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.defense.shield.hp,54); // 8♥ x 0.85 -> 6
 b=move(b,'B',{type:'end'},4);
 assert.equal(b.liveLegacy.malus.B,null);
});
test('Dado Quantico usa il seed e una carta vera; nessun premio fittizio',()=>{
 let b=battle();
 b.sides.A.special.hand[0].type='tactic-quantum-dice';
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'dice_not_ready');
 b.sides.A.legacy.diceReady=true;
 b.sides.A.legacy.dicePatterns=['plus','minus','pair'];
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 assert.equal(b.sides.A.legacy.diceReady,false);
 assert.equal(b.sides.A.legacy.dicePatterns.length,0);
 assert.equal(b.sides.A.special.hand.length,4);
 assert.ok(b.history.some(e=>e.kind==='quantum_dice'));
 assert.ok(['module','malus','heal','dust','ether','damage'].includes(b.sides.A.legacy.lastDice.face));
});
test('Mutazione di firma difende un proprio vitale esposto per un turno nemico e poi si annulla',()=>{
 let b=battle('N00','C01');
 b.sides.A.defense.shield.hp=45;
 b=move(b,'A',{type:'end'},1);
 b=move(b,'B',{type:'expose',vitalId:'engine'},2);
 b=move(b,'B',{type:'end'},3);
 assert.equal(b.sides.A.defense.parts.engine.exposed,true);
 const original=structuredClone(b.sides.A.defense.parts.engine.signature);
 b.sides.A.special.hand[0].type='tactic-signature-mutation';
 b=move(b,'A',{type:'special',index:0,slot:'open-0',vitalId:'engine'},4);
 assert.notDeepEqual(b.sides.A.defense.parts.engine.signature,original);
 b=move(b,'A',{type:'end'},5);
 assert.notDeepEqual(b.sides.A.defense.parts.engine.signature,original);
 b=move(b,'B',{type:'end'},6);
 assert.deepEqual(b.sides.A.defense.parts.engine.signature,original);
 assert.equal(b.liveLegacy.mutations.A,null);
});


test('32 moduli 16F supportati nel live, 3 effetti non migrati restano bloccati',()=>{
 const modules=PHASE16F_MODULES;
 for(const [id,def] of Object.entries(modules)){
  const expected=!['hand_jam','burn'].includes(def.effect);
  assert.equal(supportedLiveSpecial('module-card-'+id),expected,id);
 }
});

test('Modulo Ariete infligge 8 danni veri alla barriera senza sbloccare vitali gratis',()=>{
 let b=battle('N00','N00');
 b.sides.A.equipmentLevels['module-card-aries']=1;
 b.sides.A.special.hand[0].type='module-card-aries';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.B.defense.shield.hp,52);
 assert.equal(b.sides.B.defense.parts.engine.hp,10);
 assert.ok(b.history.some(e=>e.kind==='module'));
});
test('Modulo Toro cura barriera soltanto se danneggiata; livelli assenti non consumano carte',()=>{
 let b=battle();
 b.sides.A.special.hand[0].type='module-card-taurus';
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'module_unowned');
 assert.equal(b.sides.A.special.hand.length,5);
 b.sides.A.equipmentLevels['module-card-taurus']=1;
 b.sides.A.defense.shield.hp=40;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 assert.equal(b.sides.A.defense.shield.hp,49);
});
test('Modulo Capricorno consuma protezione sul colpo reale e non danneggia la barriera',()=>{
 let b=battle('N00','N00');
 b.sides.A.equipmentLevels['module-card-capricorn']=1;
 b.sides.A.special.hand[0].type='module-card-capricorn';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.liveModuleEffects.A.guard,9);
 b=move(b,'A',{type:'end'},2);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.defense.shield.hp,60);
 assert.equal(b.liveModuleEffects.A.guard,1);
});
test('Modulo Vergine blocca fuoco nativo soltanto nel prossimo turno avversario',()=>{
 let b=battle('N00','N00');
 b.sides.A.equipmentLevels['module-card-virgo']=1;
 b.sides.A.special.hand[0].type='module-card-virgo';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'end'},2);
 const shot=applyOfficialLiveAction(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(shot.reason,'module_weapon_locked');
 assert.equal(b.sides.B.numeric.hand.length,7);
 b=move(b,'B',{type:'end'},4);
 assert.equal(b.liveModuleEffects.B.lockUntilTurn,0);
});
test('Modulo Cancro usa 2 numeriche autentiche e non aumenta la mano oltre 7',()=>{
 let b=battle();
 b.sides.A.equipmentLevels['module-card-cancer']=1;
 b.sides.A.special.hand[0].type='module-card-cancer';
 const old=[b.sides.A.numeric.hand[0].id,b.sides.A.numeric.hand[1].id];
 b=move(b,'A',{type:'special',index:0,slot:'open-0',recycleIndices:[0,1]},1);
 assert.equal(b.sides.A.numeric.hand.length,7);
 assert.equal(old.some(id=>b.sides.A.numeric.hand.some(c=>c.id===id)),false);
 assert.equal(b.actionUsed.numeric,0);
});
test('Modulo Mercurio carica il Dado ma serve ancora la Carta Dado per lanciarlo',()=>{
 let b=battle();
 b.sides.A.equipmentLevels['module-card-planet_char_4']=1;
 b.sides.A.special.hand[0].type='module-card-planet_char_4';
 b.sides.A.special.hand[1].type='tactic-quantum-dice';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.legacy.diceReady,true);
 assert.equal(b.history.some(e=>e.kind==='quantum_dice'),false);
 b=move(b,'A',{type:'special',index:0,slot:'open-1'},2);
 assert.equal(b.sides.A.legacy.diceReady,false);
 assert.equal(b.history.some(e=>e.kind==='quantum_dice'),true);
});

test('Sagittario protegge dai Malus autentici nel turno nemico senza saltare 30 secondi',()=>{
 let b=battle('N00','N00');
 b.sides.A.equipmentLevels['module-card-sagittarius']=1;
 b.sides.A.special.hand[0].type='module-card-sagittarius';
 b.sides.B.special.hand[0].type='tactic-malus';
 b.sides.B.legacy.malusCharge=3;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.liveModuleEffects.A.debuffShieldUntilTurn,2);
 b=move(b,'A',{type:'end'},2);
 b=move(b,'B',{type:'special',index:0,slot:'open-0',malusChoice:'lock_weapon'},3);
 assert.equal(b.liveLegacy.malus.A,null);
 assert.equal(b.sides.B.legacy.malusCharge,0);
 assert.ok(b.history.some(e=>e.kind==='malus_blocked'));
 assert.equal(b.phase,'playing');
});
test('Saturno Modulo neutralizza il blocco armamenti di Vergine sul turno avversario',()=>{
 let b=battle('N00','N00');
 b.sides.A.equipmentLevels['module-card-planet_char_6']=1;
 b.sides.A.special.hand[0].type='module-card-planet_char_6';
 b.sides.B.equipmentLevels['module-card-virgo']=1;
 b.sides.B.special.hand[0].type='module-card-virgo';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'end'},2);
 b=move(b,'B',{type:'special',index:0,slot:'open-0'},3);
 assert.equal(b.liveModuleEffects.A.lockUntilTurn,0);
 assert.ok(b.history.some(e=>e.kind==='module_blocked'));
});
