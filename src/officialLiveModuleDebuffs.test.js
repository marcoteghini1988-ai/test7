import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn}
 from './officialLiveDuelEngine.js';

const game=()=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'N00',shipB:'N00',levelA:1,levelB:1,nowMs:0}),0);
function move(b,key,action,t){
 const response=applyOfficialLiveAction(b,key,action,t);
 assert.equal(response.ok,true,JSON.stringify({key,action,reason:response.reason}));
 return response.battle;
}
function equip(b,key,id){
 b.sides[key].equipmentLevels[id]=1;
 b.sides[key].special.hand[0].type=id;
 return b;
}
test('Scorpione -20% sui colpi numerici del solo prossimo turno, non riduce la mano',()=>{
 let b=equip(game(),'A','module-card-scorpio');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.liveModuleEffects.B.precisionFactor,.8);
 assert.equal(b.liveModuleEffects.B.precisionUntilTurn,2);
 b=finishOfficialLiveTurn(b,2);
 assert.equal(b.sides.B.numeric.hand.length,7);
 const clean=structuredClone(b);
 clean.liveModuleEffects.B.precisionFactor=1;
 clean.liveModuleEffects.B.precisionUntilTurn=0;
 const baseline=move(clean,'B',{type:'numeric',index:0,target:'ship'},3);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 const rawDamage=60-baseline.sides.A.defense.shield.hp;
 const debuffedDamage=60-b.sides.A.defense.shield.hp;
 assert.equal(debuffedDamage,Math.floor(rawDamage*.8));
 b=finishOfficialLiveTurn(b,4);
 assert.equal(b.liveModuleEffects.B.precisionFactor,1);
 assert.equal(b.liveModuleEffects.B.precisionUntilTurn,0);
});
test('La protezione Saturno neutralizza il disturbo Scorpione senza consumare numeriche',()=>{
 let b=equip(game(),'A','module-card-planet_char_6');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=finishOfficialLiveTurn(b,2);
 b.sides.B.special.hand[0].type='module-card-scorpio';
 b.sides.B.equipmentLevels['module-card-scorpio']=1;
 b=move(b,'B',{type:'special',index:0,slot:'open-0'},3);
 assert.equal(b.liveModuleEffects.A.precisionFactor,1);
 assert.equal(b.liveModuleEffects.A.precisionUntilTurn,0);
 assert.ok(b.history.some(x=>x.kind==='module_blocked'));
});
test('Ustione Io usa solo la prossima salva reale e il calore dà +3 una sola volta',()=>{
 let b=equip(game(),'A','module-card-planet_char_19');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.liveModuleEffects.A.burnCharges,1);
 assert.equal(b.sides.B.heated,false);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.defense.shield.hp,57);
 assert.equal(b.sides.B.heated,true);
 assert.equal(b.liveModuleEffects.A.burnCharges,0);
 b=finishOfficialLiveTurn(b,3);
 b=finishOfficialLiveTurn(b,4);
 const before=b.sides.B.defense.shield.hp;
 const noHeat=structuredClone(b);
 noHeat.sides.B.heated=false;
 const baseline=move(noHeat,'A',{type:'numeric',index:0,target:'ship'},5);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},5);
 assert.equal(b.sides.B.heated,false);
 assert.equal(before-b.sides.B.defense.shield.hp,
  before-baseline.sides.B.defense.shield.hp+3);
});
test('Monolite attivo impedisce ustione Ophiuchus dopo un colpo valido',()=>{
 let b=game();
 b.sides.B.epic.entitlements=['epic_item_7'];
 b.sides.B.epic.active={id:'epic_item_7',startedRound:1,untilRound:3};
 b=equip(b,'A','module-card-ophiuchus');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.heated,false);
 assert.equal(b.liveModuleEffects.A.burnCharges,0);
 assert.ok(b.history.some(x=>x.kind==='module_burn_blocked'));
});
