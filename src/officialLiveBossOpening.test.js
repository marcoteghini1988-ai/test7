import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,
 chooseOfficialLiveAiAction} from './officialLiveDuelEngine.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {VITAL_IDS,exposeMotherPart} from './vitalDefense.js';

function ready({ship='C01',boss=2,levelA=1,mode='campaign'}={}){
 const tactical=createTacticalDuel({
  shipA:'N00',shipB:ship,levelA,levelB:1,nowMs:0,mode,
  bossPlanetB:boss,specialDeckB:[...TACTICAL_STARTER_TYPES]
 });
 const b=createOfficialLiveDuel(tactical,0);
 b.activeSide='B';b.turn=2;b.round=1;
 return b;
}
function equipSpecial(b,type){
 const pile=b.sides.B.special;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=all.find(c=>c.type===type);
 assert.ok(chosen,'speciale autentica nel mazzo da 24: '+type);
 const without=all.filter(c=>c.id!==chosen.id);
 pile.hand=[chosen,...without.slice(0,4)];
 const selected=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!selected.has(c.id));
 pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,24);
 assert.equal(new Set([...pile.hand,...pile.deck].map(c=>c.id)).size,24);
}
const act=(b,action,nowMs)=>{
 const out=applyOfficialLiveAction(b,'B',action,nowMs);
 assert.equal(out.ok,true,JSON.stringify({action,reason:out.reason}));
 return out.battle;
};
test('Boss Tharsis: la speciale Cinetica autentica viene giocata PRIMA del colpo immediato',()=>{
 let b=ready();equipSpecial(b,'tactic-kinetic');
 const first=chooseOfficialLiveAiAction(b);
 assert.equal(first.type,'special');
 assert.equal(b.sides.B.special.hand[first.index].type,'tactic-kinetic');
 assert.equal(first.slot,'open-0');
 const before=b.sides.A.defense.shield.hp;
 b=act(b,first,1);
 assert.equal(b.actionUsed.special,1);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.pendingShot.B.power,6);
 const next=chooseOfficialLiveAiAction(b);
 assert.equal(next.type,'numeric','non spende altre speciali prima di scaricare il bonus');
 assert.equal(next.target,'ship');
 const card=b.sides.B.numeric.hand[next.index];
 assert.equal(card.suit,'♥','C01 usa soltanto H');
 b=act(b,next,2);
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.history.filter(e=>e.kind==='shot'&&e.by==='B').length,1);
 assert.ok(b.sides.A.defense.shield.hp<before);
 assert.equal(b.pendingShot.B,null,'il bonus si consuma dopo il proiettile');
 const without=ready(),i=without.sides.B.numeric.hand.findIndex(c=>c.id===card.id);
 assert.ok(i>=0);
 const plain=act(without,{type:'numeric',index:i,target:'ship',shipId:'mother'},2);
 assert.equal(plain.sides.A.defense.shield.hp-b.sides.A.defense.shield.hp,6,
  'il +6 segue solo il colpo reale e non regala attacchi');
});
test('Boss con arma Accumulo non carica una speciale quando ancora non può sparare',()=>{
 let b=ready({ship:'C02'});equipSpecial(b,'tactic-kinetic');
 const choice=chooseOfficialLiveAiAction(b);
 assert.equal(choice.type,'numeric');
 assert.equal(choice.target,'ship');
 b=act(b,choice,1);
 assert.equal(b.history.some(e=>e.kind==='shot'),false);
 assert.equal(b.history.some(e=>e.kind==='weapon_charge'),true);
 assert.equal(b.actionUsed.special,0);
});
test('Speciali Perforante e Soppressione non vengono anticipate senza scudiere nemiche',()=>{
 for(const type of ['shot-piercing','tactic-suppress']){
  const b=ready({levelA:1});equipSpecial(b,type);
  const choice=chooseOfficialLiveAiAction(b);
  assert.notEqual(choice.type,'special',type+' non ha un bersaglio utile in apertura');
 }
});
test('Quando uno scudo è già alla soglia, il boss mantiene il piano sui vitali',()=>{
 let b=ready();equipSpecial(b,'tactic-kinetic');
 b.sides.A.defense.shield.hp=45;
 const choice=chooseOfficialLiveAiAction(b);
 assert.deepEqual(choice,{type:'expose',vitalId:'weapons'},
  'Tharsis segue la dottrina esistente e non forza un potenziamento');
});
test('PvP finto non riceve il comportamento esclusivo dei boss nemici',()=>{
 const b=ready({boss:null,mode:'pvp'});equipSpecial(b,'tactic-kinetic');
 const choice=chooseOfficialLiveAiAction(b);
 assert.equal(choice.type,'numeric');
 assert.equal(choice.target,'ship');
 assert.equal(b.sides.B.bossPlanetId,null);
});

test('Boss ricicla 2 numeriche vere prima di scartare quando la barriera e a zero',()=>{
 let b=ready({ship:'C01',boss:2});
 equipSpecial(b,'tactic-numeric-recycle');
 b.sides.A.defense.shield.hp=0;
 for(const id of VITAL_IDS){
  const result=exposeMotherPart(b.sides.A.defense,id);
  assert.equal(result.exposed,true);
  b.sides.A.defense=result.defense;
  // Fixture senza formule giocabili: isola la scelta di Ricambio.
  b.sides.A.defense.parts[id].signature={
   kind:'mathGate',op:'plus',target:99,allowedCardCounts:[2,3]
  };
 }
 const before=[...b.sides.B.numeric.hand,...b.sides.B.numeric.deck,
  ...b.sides.B.numeric.discard];
 assert.equal(before.length,52);
 const expected=new Set(before.map(c=>c.id));
 const pvp=structuredClone(b);
 pvp.mode='pvp';pvp.sides.B.bossPlanetId=null;
 assert.equal(chooseOfficialLiveAiAction(pvp).type,'numeric-discard',
  'il PvP simulato conserva la propria priorita numerica');
 const first=chooseOfficialLiveAiAction(b);
 assert.equal(first.type,'special');
 assert.equal(b.sides.B.special.hand[first.index].type,'tactic-numeric-recycle');
 assert.equal(first.slot,'open-0');
 assert.equal(first.recycleIndices.length,2);
 b=act(b,first,1);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.actionUsed.special,1);
 assert.equal(b.zones.B.open[0].type,'tactic-numeric-recycle');
 assert.equal(b.sides.B.numeric.hand.length,7,'mano ripristinata usando il mazzo');
 const after=[...b.sides.B.numeric.hand,...b.sides.B.numeric.deck,
  ...b.sides.B.numeric.discard];
 assert.equal(after.length,52);
 assert.deepEqual(new Set(after.map(c=>c.id)),expected,
  'le carte appartengono tutte al mazzo fisico originale');
 const second=chooseOfficialLiveAiAction(b);
 assert.equal(second.type,'numeric-discard',
  'non usa una seconda carta Ricambio nello stesso turno senza motivo');
});


test('Risonanza usa una Fusione vera solo a 100 Sincronia prima del colpo nativo',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:4,levelB:5,nowMs:0,
  mode:'campaign',bossPlanetB:17,specialDeckB:buildTacticalBossDeck(17,5,4)
 }),0);
 b.turn=2;b.round=1;b.activeSide='B';
 assert.equal(b.sides.B.escorts.filter(e=>e.hp>0).length,2);
 b.sides.B.sync=100; // Solo fixture: in LIVE deve essere guadagnata.
 equipSpecial(b,'fusion-triad');
 // Confronto del danno: lascia in mano solo carte Fusione,
 // cosi' nessun bonus offensivo diverso dalla Fusione altera il test.
 const specials=b.sides.B.special,allCards=[...specials.hand,...specials.deck,...specials.discard];
 const chosen=[allCards.find(c=>c.type==='fusion-triad'),
  ...allCards.filter(c=>c.type==='fusion-strike').slice(0,2),
  ...allCards.filter(c=>c.type==='tactic-scan').slice(0,2)];
 assert.equal(chosen.length,5);
 assert.ok(chosen.every(Boolean));
 const selected=new Set(chosen.map(c=>c.id));
 specials.hand=chosen;
 specials.deck=allCards.filter(c=>!selected.has(c.id));
 specials.discard=[];
 assert.equal(specials.hand.length+specials.deck.length,24);
 const first=chooseOfficialLiveAiAction(b);
 assert.equal(first.type,'special');
 assert.equal(b.sides.B.special.hand[first.index].type,'fusion-triad');
 assert.equal(first.slot,'open-0');
 const original=structuredClone(b);
 b=act(b,first,1);
 assert.equal(b.sides.B.sync,0,'la carta consuma 100 Sincronia vera');
 assert.equal(b.actionUsed.special,1);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.pendingShot.B.fusion,.35);
 const next=chooseOfficialLiveAiAction(b);
 assert.equal(next.type,'numeric');
 assert.equal(next.target,'ship');
 assert.equal(next.shipId,'mother');
 const card=b.sides.B.numeric.hand[next.index];
 assert.equal(card.suit,'♥','C01 può sparare subito con un ♥ reale');
 b=act(b,next,2);
 assert.equal(b.history.filter(e=>e.kind==='shot'&&e.by==='B').length,1);
 const plain=act(original,{type:'numeric',index:next.index,target:'ship',
  shipId:'mother'},2);
 assert.ok(b.sides.A.defense.shield.hp<plain.sides.A.defense.shield.hp,
  'la Fusione deve aumentare solo un colpo che avviene realmente');
 assert.equal(b.pendingShot.B,null);
 const lowSync=structuredClone(original);
 lowSync.sides.B.sync=99;
 const noFusion=chooseOfficialLiveAiAction(lowSync);
 assert.notEqual(noFusion.type,'special','mai fusione senza 100 Sincronia');
 const pvp=structuredClone(original);
 pvp.mode='pvp';pvp.sides.B.bossPlanetId=null;
 assert.equal(chooseOfficialLiveAiAction(pvp).type,'numeric',
  'il PvP simulato non riceve la tattica specifica di Risonanza');
});
