import test from 'node:test';import assert from 'node:assert/strict';
import {createShip,evaluatePair,generateTargets,findMoves,consumeAttack,initialBattle,sacrificeCard,etherChange,dealHit,healthScore,deckVerdict,isDestroyed,aiChoose,validFleet,newVessel,previewVolley,getAmmo,supportedOperators,vesselDestroyed,applyPendingHit,withPrototypeMother,REALTIME_AI_MIN_MS,REALTIME_AI_MAX_MS,REALTIME_AI_FINAL_REDUCTION_MS,AI_CAMPAIGN_LAST_SECTOR,aiDecisionWindow,nextAiActionDelay} from './mathDuelEngine.js';
const rng=()=>.5, cards=(a,sa,b,sb)=>[{value:a,suit:sa,id:'a'},{value:b,suit:sb,id:'b'}];
test('mazzo 52 carte, mano sette, nessuna carta duplicata',()=>{const s=createShip(1,false,{},rng);assert.equal(s.hand.length,7);assert.equal(s.deck.length,45);assert.equal(new Set([...s.hand,...s.deck].map(x=>x.id)).size,52);});
test('quattro calcoli matematici corretti anche in ordine inverso',()=>{assert.ok(evaluatePair('plus',5,4,9));assert.ok(evaluatePair('minus',3,9,6));assert.ok(evaluatePair('times',5,4,20));assert.ok(evaluatePair('divide',2,10,5));assert.equal(evaluatePair('divide',3,5,4),null);});
test('bersagli indipendenti dalle carte',()=>{assert.deepEqual(Object.keys(generateTargets(rng)),['plus','minus','times','divide']);});
test('7 carte reintegrate pescando due carte vere',()=>{const s=createShip(1,false,{},rng);const x=consumeAttack(s,[0,1]);assert.equal(x.hand.length,7);assert.equal(x.deck.length,43);assert.equal(x.discard.length,2);});
test('universale unico, tre navi massimo, semi ripetuti massimo due',()=>{assert.ok(validFleet(['N00']));assert.ok(validFleet(['N00','C01','C02']));assert.ok(validFleet(['N00','C01','C04']));assert.equal(validFleet([]),false);assert.equal(validFleet(['N00','N00']),false);assert.equal(validFleet(['N00','C01','C02','C03']),false);assert.equal(validFleet(['N00','C01','XX']),false);});
test('nave universale ha sempre + e − ma non ×/÷',()=>{for(let l=1;l<=5;l++){const v=newVessel('N00',l);assert.deepEqual(Object.keys(v.engines),['plus','minus']);assert.equal(v.weapons.length,1);}});
test('nave C03 sblocca terzo motore solo al livello 4',()=>{assert.equal(Object.keys(newVessel('C03',3).engines).length,2);assert.equal(Object.keys(newVessel('C03',4).engines).length,3);});
test('un valore di carta = proiettili del suo seme, non risultato',()=>{assert.deepEqual(getAmmo(cards(8,'♣',3,'♦')),{H:0,D:3,C:8,S:0});});
test('esempio: 8♣ x 3♦ =24, universale 11, C03 16, C02 accumula 3',()=>{const a=createShip(1,false,{fleetIds:['N00','C02','C03']},rng);const vol=previewVolley(a,cards(8,'♣',3,'♦'));assert.equal(vol.totalDamage,27);assert.equal(vol.shots.find(s=>s.shipId==='N00').bullets,11);assert.equal(vol.shots.find(s=>s.shipId==='C02').charge,3);assert.equal(vol.shots.find(s=>s.shipId==='C03'&&s.suit==='C').bullets,8);});
test('due carte dello stesso seme sommano munizioni per ogni arma',()=>{const a=createShip(1,false,{fleetIds:['N00','C01','C04']},rng);const vol=previewVolley(a,cards(8,'♥',3,'♥'));assert.equal(vol.shots.find(s=>s.shipId==='N00').bullets,11);assert.equal(vol.shots.find(s=>s.shipId==='C01').bullets,11);assert.equal(vol.shots.find(s=>s.shipId==='C04'&&s.suit==='H').bullets,10);assert.equal(vol.shots.find(s=>s.shipId==='C04'&&s.suit==='H').charge,1);});
test('arma ad accumulo spara una sola volta a soglia, conserva il resto',()=>{let a=createShip(1,false,{fleetIds:['C02']},rng),v=previewVolley(a,cards(8,'♦',3,'♠'));assert.equal(v.totalDamage,0);assert.equal(v.shots[0].charge,8);a.fleet=v.fleet;v=previewVolley(a,cards(7,'♦',2,'♥'));assert.equal(v.shots[0].bullets,12);assert.equal(v.shots[0].charge,3);assert.equal(v.totalDamage,36);});
test('calcolo corretto non usa risultato numerico come danno',()=>{let a=createShip(1,false,{fleetIds:['N00']},rng),b=createShip(1,true,{fleetIds:['N00']},rng);const h=dealHit(b,a,'plus',24,cards(8,'♣',3,'♦'));assert.equal(h.damage,11);assert.equal(h.defender.fleet[0].engines.plus.hp,b.fleet[0].engines.plus.hp-11);});
test('motore a zero rimane visivamente distrutto, non può subire altri colpi',()=>{let a=createShip(1,false,{fleetIds:['N00']},rng),b=createShip(1,true,{fleetIds:['N00']},rng);b.fleet[0].engines.plus.hp=2;let h=dealHit(b,a,'plus',11,cards(9,'♥',2,'♦'));assert.equal(h.damage,2);assert.equal(h.destroyed,true);assert.equal(h.defender.fleet[0].engines.plus.hp,0);assert.equal(vesselDestroyed(h.defender.fleet[0]),false);});
test('vittoria quando tutte le navi della flotta perdono tutti i loro motori',()=>{const s=createShip(1,true,{fleetIds:['N00','C01']},rng);s.fleet[0].engines.plus.hp=0;s.fleet[0].engines.minus.hp=0;assert.equal(isDestroyed(s),false);for(const v of s.fleet)for(const e of Object.values(v.engines))e.hp=0;assert.equal(isDestroyed(s),true);});
test('vince la percentuale di HP residua a mazzo finito',()=>{const a=createShip(1,false,{fleetIds:['N00']},rng),b=createShip(1,true,{fleetIds:['C01']},rng);b.fleet[0].engines.minus.hp=1;assert.equal(deckVerdict(a,b),'player');assert.equal(healthScore(a),1);});
test('sacrifici primo +3 HP nemico, secondo -3 sec, terzo -3 HP proprio',()=>{let a=createShip(1,false,{},rng),b=createShip(1,true,{},rng);let t=sacrificeCard(a,0,b,60);assert.equal(t.ship.sacrifices,1);assert.ok(t.opponent.fleet[0].engines.plus.hp>a.fleet[0].engines.plus.hp);t=sacrificeCard(t.ship,0,t.opponent,60);assert.equal(t.seconds,57);t=sacrificeCard(t.ship,0,t.opponent,57);assert.ok(healthScore(t.ship)<1);assert.equal(sacrificeCard(t.ship,0,t.opponent,57),null);});
test('etere consuma una risorsa e non crea carte',()=>{let s=createShip(1,false,{},rng);let x=etherChange(s,0);assert.equal(x.ether,1);assert.equal(x.hand.length,7);x=etherChange(x,0);assert.equal(etherChange(x,0),null);});
test('IA sceglie solo operatori attivi e calcoli validi con carte proprie',()=>{const b=initialBattle(1,{},rng),move=aiChoose(b.enemy,b.player,b.targets,rng);if(move){assert.ok(move.i>=0&&move.j<7);assert.ok(evaluatePair(move.op,b.enemy.hand[move.i].value,b.enemy.hand[move.j].value,b.targets[move.op]));assert.ok(supportedOperators(b.enemy).includes(move.op));}});
test('500 colpi simulati: munizioni e HP mai negativi',()=>{for(let i=0;i<500;i++){const a=createShip(1,false,{fleetIds:['N00','C02','C03'],shipLevel:(i%5)+1},Math.random),b=createShip(1,true,{fleetIds:['N00','C01','C04'],shipLevel:(i%5)+1},Math.random),c=cards(i%13+1,['♥','♦','♣','♠'][i%4],(i*7)%13+1,['♥','♦','♣','♠'][(i+2)%4]),op=i%3===0?'plus':i%3===1?'minus':'times';if(!b.fleet[0].engines[op])continue;const h=dealHit(b,a,op,9,c);assert.ok(h.damage>=0);assert.ok(h.damage<=h.rawDamage);assert.ok(healthScore(h.defender)>=0);for(const s of h.volley)assert.ok(s.charge>=0&&s.damage>=0);}});

// Fase 1A — test di regressione del riconoscimento matematico e dei bersagli.
import {ENGINE_KEYS,TARGET_POOLS,rankLabel,inspectCalculation,calculation} from './mathDuelEngine.js';
test('asso e figure hanno i valori visualizzati e calcolati coerenti',()=>{
 assert.equal(rankLabel(1),'A');assert.equal(rankLabel(11),'J');assert.equal(rankLabel(12),'Q');assert.equal(rankLabel(13),'K');
 assert.equal(calculation('plus',1,13),14);assert.equal(calculation('times',11,12),132);
 assert.ok(evaluatePair('plus',1,13,14));assert.ok(evaluatePair('minus',13,1,12));
 assert.ok(evaluatePair('divide',12,3,4));assert.ok(evaluatePair('times',11,13,143));
});
test('tutte le 4 operazioni e le inversioni consentite sono riconosciute',()=>{
 for(const [op,a,b,target] of [['plus',8,1,9],['times',8,3,24],['minus',3,8,5],['divide',3,12,4]]){
  const valid=inspectCalculation(op,a,b,target);
  assert.equal(valid.valid,true,`${op} ${a} ${b} → ${target}`);
  assert.equal(valid.result,target);
 }
 assert.equal(inspectCalculation('plus',8,1,17).valid,false);
 assert.equal(inspectCalculation('plus',8,1,17).result,9);
 assert.equal(inspectCalculation('divide',8,3,3).valid,false); // 8 ÷ 3 non è esatta
});
test('nessun falso negativo su tutte le coppie A..K e tutti gli operatori',()=>{
 for(const op of ENGINE_KEYS)for(let a=1;a<=13;a++)for(let b=1;b<=13;b++){
  const result=calculation(op,a,b);
  if(!Number.isInteger(result))continue;
  const hit=evaluatePair(op,a,b,result);
  assert.ok(hit,`Falso negativo ${a} ${op} ${b} = ${result}`);
  assert.equal(hit.result,result);
  assert.equal(inspectCalculation(op,a,b,result).valid,true);
 }
});
test('nessun falso positivo per bersagli diversi dai risultati possibili',()=>{
 for(const op of ENGINE_KEYS)for(let a=1;a<=13;a++)for(let b=1;b<=13;b++){
  const expected=[calculation(op,a,b)];
  if(op==='minus'||op==='divide')expected.push(calculation(op,b,a));
  for(let goal=-5;goal<=40;goal++){
   const valid=expected.some(v=>Number.isInteger(v)&&v===goal);
   assert.equal(Boolean(evaluatePair(op,a,b,goal)),valid,`${a} ${op} ${b} → ${goal}`);
  }
 }
});
test('ogni bersaglio generabile è risolvibile in teoria con due carte 1..13',()=>{
 for(const op of ENGINE_KEYS)for(const goal of TARGET_POOLS[op]){
  let possible=false;
  for(let a=1;a<=13&&!possible;a++)for(let b=1;b<=13;b++)if(evaluatePair(op,a,b,goal)){possible=true;break;}
  assert.ok(possible,`Bersaglio irraggiungibile ${op} ${goal}`);
 }
});
test('50.000 generazioni indipendenti dalla mano non producono bersagli irraggiungibili',()=>{
 const possible=Object.fromEntries(ENGINE_KEYS.map(op=>[op,new Set(TARGET_POOLS[op])]));
 for(let i=0;i<50000;i++){
  const targets=generateTargets(Math.random,1+i%30);
  for(const op of ENGINE_KEYS)assert.ok(possible[op].has(targets[op]),`Target impossibile ${op} ${targets[op]}`);
 }
});
test('operazioni non sbloccate rimangono indisponibili, non sono errori matematici',()=>{
 const starter=createShip(1,false,{fleetIds:['N00']},rng);
 assert.deepEqual(supportedOperators(starter),['plus','minus']);
 const unlock=createShip(1,false,{fleetIds:['C03'],shipLevel:4},rng);
 assert.ok(supportedOperators(unlock).includes('times'));
 assert.ok(evaluatePair('times',8,3,24));
});

// Fase 1F — engine target selector regression tests.
import {nextAttackTarget} from './mathDuelEngine.js';
test('after plus reaches 0 HP, minus on the same ship becomes selected',()=>{
 const player=createShip(1,false,{fleetIds:['N00']},rng);
 const enemy=createShip(1,true,{fleetIds:['N00']},rng);
 enemy.fleet[0].engines.plus.hp=0;
 assert.deepEqual(nextAttackTarget(player,enemy,0,'plus'),{targetShip:0,target:'minus'});
});
test('destroying both engines on one enemy ship selects the next ship',()=>{
 const player=createShip(1,false,{fleetIds:['N00','C01']},rng);
 const enemy=createShip(1,true,{fleetIds:['N00','C01']},rng);
 enemy.fleet[0].engines.plus.hp=0;
 enemy.fleet[0].engines.minus.hp=0;
 assert.deepEqual(nextAttackTarget(player,enemy,0,'plus'),{targetShip:1,target:'plus'});
});
test('retains an intact selected engine and lets user select the other one manually',()=>{
 const player=createShip(1,false,{fleetIds:['N00']},rng);
 const enemy=createShip(1,true,{fleetIds:['N00']},rng);
 assert.deepEqual(nextAttackTarget(player,enemy,0,'plus'),{targetShip:0,target:'plus'});
 assert.deepEqual(nextAttackTarget(player,enemy,0,'minus'),{targetShip:0,target:'minus'});
});
test('dead operators on player side cannot target enemies, but other operators can',()=>{
 const player=createShip(1,false,{fleetIds:['N00']},rng);
 const enemy=createShip(1,true,{fleetIds:['N00']},rng);
 player.fleet[0].engines.plus.hp=0;
 assert.deepEqual(nextAttackTarget(player,enemy,0,'plus'),{targetShip:0,target:'minus'});
});
test('when no compatible enemy motor remains, return null rather than selecting a destroyed motor',()=>{
 const player=createShip(1,false,{fleetIds:['N00']},rng);
 const enemy=createShip(1,true,{fleetIds:['N00']},rng);
 enemy.fleet[0].engines.plus.hp=0;
 enemy.fleet[0].engines.minus.hp=0;
 assert.equal(nextAttackTarget(player,enemy,0,'plus'),null);
});

// Fase continuo: nessun timer per il giocatore, solo ritmo IA.
test('nessun timer o scadenza in mano al giocatore',()=>{
 const b=initialBattle(1,{},rng);
 assert.equal(Object.hasOwn(b,'seconds'),false);
 assert.equal(Object.hasOwn(b,'playerDueAt'),false);
 assert.equal(Object.hasOwn(b,'aiDueAt'),true);
 assert.equal(b.aiDueAt,0);
 assert.equal(b.actor,'player');
 assert.deepEqual(Object.keys(b.targets),['plus','minus','times','divide']);
});
test('IA 35-40 secondi iniziali; più rapida in campagna avanzata',()=>{
 assert.deepEqual(aiDecisionWindow(1),{minMs:35000,maxMs:40000});
 assert.equal(nextAiActionDelay(()=>0),REALTIME_AI_MIN_MS);
 assert.equal(nextAiActionDelay(()=>.5),37500);
 assert.equal(nextAiActionDelay(()=>.999999),REALTIME_AI_MAX_MS);
 assert.equal(REALTIME_AI_FINAL_REDUCTION_MS,10000);
 assert.equal(AI_CAMPAIGN_LAST_SECTOR,120);
 assert.deepEqual(aiDecisionWindow(120),{minMs:25000,maxMs:30000});
 assert.equal(nextAiActionDelay(()=>0,120,'campaign'),25000);
 assert.equal(nextAiActionDelay(()=>.999999,120,'campaign'),30000);
 assert.equal(nextAiActionDelay(()=>.5,30,'pvp'),37500);
 assert.deepEqual(aiDecisionWindow(200,'adventure'),{minMs:25000,maxMs:30000});
 assert.deepEqual(aiDecisionWindow(1,'adventure'),{minMs:35000,maxMs:40000});
 assert.ok(aiDecisionWindow(51,'adventure').minMs<aiDecisionWindow(30,'adventure').minMs);
 for(let level=2;level<=120;level++)assert.ok(aiDecisionWindow(level).minMs<=aiDecisionWindow(level-1).minMs);
});

test('due impatti successivi mantengono entrambi i danni',()=>{
 const d=createShip(1,true,{fleetIds:['N00']},rng);
 const a=applyPendingHit(d,0,'plus',12),b=applyPendingHit(a.defender,0,'plus',18);
 assert.equal(b.defender.fleet[0].engines.plus.hp,25);
 assert.equal(a.damage,12);assert.equal(b.damage,18);
 assert.equal(d.fleet[0].engines.plus.hp,55);
});
test('colpi sovrapposti non generano HP negativi',()=>{
 const d=createShip(1,true,{},rng),a=applyPendingHit(d,0,'plus',1000);
 const b=applyPendingHit(a.defender,0,'plus',200);
 assert.equal(a.damage,55);assert.equal(a.destroyed,true);
 assert.equal(b.damage,0);assert.equal(b.destroyed,false);
 assert.equal(b.defender.fleet[0].engines.minus.hp,55);
});
test('impatto su zona inesistente o danno negativo non altera HP',()=>{
 const d=createShip(1,true,{},rng);
 for(const [i,op,n] of [[9,'plus',20],[0,'divide',20],[0,'plus',-1],[0,'plus',NaN]]){
  const hit=applyPendingHit(d,i,op,n);assert.strictEqual(hit.defender,d);assert.equal(hit.damage,0);
 }
});
test('gli eventi dei proiettili sono isolati per battaglia',()=>{
 const a=initialBattle(1,{},rng),b=initialBattle(1,{},rng);
 assert.deepEqual(a.effects,[]);a.effects.push({id:1});assert.deepEqual(b.effects,[]);
});

test('in modalità madre singola i calcoli indeboliscono lo scudo e non i motori legacy',()=>{
 const b=initialBattle(1,{vitalPrototype:true},()=>.5);
 assert.equal(b.vitalPrototype,true);
 const mother=b.enemy.fleet[0];
 const max=mother.defense.shield.max;
 const hp=mother.engines.plus.hp;
 const hit=applyPendingHit(b.enemy,0,'plus',25);
 assert.equal(hit.defender.fleet[0].defense.shield.hp,max-25);
 assert.equal(hit.defender.fleet[0].engines.plus.hp,hp);
 assert.equal(hit.damage,25);
});
test('duello madre: parte esposta danneggiabile con convalida aritmetica di prova',()=>{
 let b=initialBattle(1,{vitalPrototype:true},()=>.5);
 b.enemy=applyPendingHit(b.enemy,0,'plus',40).defender;
 const defense=b.enemy.fleet[0].defense;
 assert.ok(defense.shield.hp/defense.shield.max<=.75);
 b.enemy.fleet[0].defense={
  ...defense,exposureOrder:['engine'],
  parts:{...defense.parts,engine:{...defense.parts.engine,exposed:true}}
 };
 const hp0=b.enemy.fleet[0].defense.parts.engine.hp;
 const hit=applyPendingHit(b.enemy,0,'plus',7,
  {vitalId:'engine',cards:cards(4,'♣',6,'♥'),signatureOverride:{kind:'math',op:'plus',target:10}});
 assert.equal(hit.defender.fleet[0].defense.parts.engine.hp,hp0-7);
 assert.equal(hit.defender.fleet[0].defense.shield.hp,defense.shield.hp);
});
test('le flotte multiple mantengono la difesa precedente per non sostituire navicelle con scudiere fittizie',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00','C02','C03']},()=>.5);
 assert.equal(b.vitalPrototype,false);
 assert.equal(b.player.fleet[0].defense,undefined);
});
