import test from 'node:test';
import assert from 'node:assert/strict';
import {PVP_TERRAIN_CATALOG,PVP_TERRAIN_TYPES,isPvpTerrain,pvpTerrainAtRound,
 resolvePvpTerrain,pvpTerrainEffects} from './pvpTerrainCards.js';
import {createSpecialCollection,normalizeSpecialCollection,openSpecialPack,validateSpecialDeck,
 SPECIAL_PACK_TYPES} from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES,createTacticalDuel,
 validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const ownedShips={cards:[{instanceId:'s:N00',shipId:'N00',level:3}],loadout:['s:N00']};
const makeDeck=(type)=>[type,...TACTICAL_STARTER_TYPES.slice(1)];
function makeVisible(b,key,type){
 const side=b.sides[key];
 let i=side.special.hand.findIndex(c=>c.type===type);
 if(i>=0)return i;
 const index=side.special.deck.findIndex(c=>c.type===type);
 assert.ok(index>=0,'Carta Terreno assente dal mazzo autentico');
 const first=side.special.hand[0];
 side.special.hand[0]=side.special.deck[index];
 side.special.deck[index]=first;
 return 0;
}
function commit(b,a={},bb={}){
 const one=sealTacticalOrder(b,'A',{specialIndices:[],numericIndices:[],...a},100);
 assert.equal(one.ok,true,one.reason);
 const two=sealTacticalOrder(one.battle,'B',{specialIndices:[],numericIndices:[],...bb},101);
 assert.equal(two.ok,true,two.reason);
 return advanceTacticalDuel(two.battle,101);
}
test('Catalogo quattro Carte Terreno: effetti simmetrici non neutri e durata di due cicli',()=>{
 assert.equal(PVP_TERRAIN_TYPES.length,4);
 assert.deepEqual(PVP_TERRAIN_TYPES,[
  'terrain-debris','terrain-plasma','terrain-ionic','terrain-resonance']);
 for(const [id,terrain] of Object.entries(PVP_TERRAIN_CATALOG)){
  assert.equal(isPvpTerrain(id),true);
  assert.equal(terrain.durationCycles,2);
  assert.ok(terrain.imagePath.endsWith(id+'.png'));
  assert.equal(terrain.effects.nativeFactor!==1||terrain.effects.syncPerCalculation>0,true);
  assert.equal(terrain.effects.nativeFactor<1||terrain.effects.shieldFactor>1||
   terrain.effects.escortFactor<1||terrain.effects.repairFactor<1,true);
  assert.ok(TACTICAL_SPECIALS[id]);
 }
});
test('Un solo Terreno nel PvP, scadenza, annullamento simultaneo e veto ai boss',()=>{
 const active=resolvePvpTerrain(null,{A:'terrain-debris',B:null},3,'pvp');
 assert.equal(active.active.id,'terrain-debris');
 assert.equal(active.active.untilRound,4);
 assert.ok(pvpTerrainAtRound(active.active,4));
 assert.equal(pvpTerrainAtRound(active.active,5),null);
 assert.equal(pvpTerrainEffects(active.active,4).shieldFactor,.88);
 assert.equal(pvpTerrainEffects(active.active,5).shieldFactor,1);
 assert.equal(resolvePvpTerrain(active.active,{A:null,B:null},5,'pvp').active,null);
 const canceled=resolvePvpTerrain(active.active,{A:'terrain-plasma',B:'terrain-ionic'},4,'pvp');
 assert.equal(canceled.active,null);
 assert.match(canceled.event,/annullati/);
 assert.equal(resolvePvpTerrain(active.active,{A:null,B:null},4,'campaign').active,null);
 assert.equal(resolvePvpTerrain(active.active,{A:null,B:null},4,'pvp',1).active,null);
 assert.throws(()=>resolvePvpTerrain(null,{A:'fake',B:null},1,'pvp'),/non valida/);
});
test('Vecchi salvataggi: Terreni nuovi a 0, premi/pacchetti non li regalano',()=>{
 const current=createSpecialCollection();
 const legacy={...current,owned:Object.fromEntries(
  Object.entries(current.owned).filter(([id])=>!isPvpTerrain(id)))};
 const normalized=normalizeSpecialCollection(legacy);
 for(const id of PVP_TERRAIN_TYPES){
  assert.equal(normalized.owned[id],0);
  assert.equal(SPECIAL_PACK_TYPES.includes(id),false);
 }
 const drop=openSpecialPack({...normalized,packCredits:1},()=>.99);
 assert.equal(drop.opened,true);
 assert.ok(drop.drawn.every(x=>!isPvpTerrain(x)));
});
test('In campagna il Terreno è filtrato con copie realmente possedute, senza alterare la collezione',()=>{
 const original=createSpecialCollection();
 const altered={...original,owned:{...original.owned,'terrain-debris':1},
  loadout:['terrain-debris',...original.loadout.slice(1)]};
 assert.equal(validateSpecialDeck(altered,altered.loadout).valid,true);
 const frozen=JSON.stringify(altered);
 const safe=combatSpecialLoadout(altered,'campaign');
 assert.equal(safe.length,24);
 assert.equal(safe.some(isPvpTerrain),false);
 assert.equal(JSON.stringify(altered),frozen);
 const pvp=combatSpecialLoadout(altered,'pvp');
 assert.equal(pvp.filter(isPvpTerrain).length,1);
 const b=officialBattleSetup({mode:'campaign',sectorNumber:10,bossPlanetId:1,
  bossSectorLevel:10,shipCollection:ownedShips,specialCollection:altered,seed:44});
 assert.equal(b.battle.sides.A.special.hand.concat(b.battle.sides.A.special.deck)
  .some(c=>isPvpTerrain(c.type)),false);
 assert.equal(b.battle.arenaId,'boss_1');
 const online=officialBattleSetup({mode:'pvp',shipCollection:ownedShips,
  specialCollection:altered,seed:44});
 assert.equal(online.battle.mode,'pvp');
 assert.equal(online.battle.sides.A.special.hand.concat(online.battle.sides.A.special.deck)
  .filter(c=>isPvpTerrain(c.type)).length,1);
});
test('Impossibile attivare Terreno in campagna o due Terreni nello stesso ordine',()=>{
 const b=createTacticalDuel({mode:'campaign',bossPlanetB:1,
  specialDeckA:makeDeck('terrain-debris')});
 makeVisible(b,'A','terrain-debris');
 assert.equal(validateTacticalOrder(b,'A',{specialIndices:[0],numericIndices:[]}).reason,'terrain_pvp_only');
 const p=createTacticalDuel({mode:'pvp',specialDeckA:[
  'terrain-debris','terrain-plasma',...TACTICAL_STARTER_TYPES.slice(2)]});
 const first=makeVisible(p,'A','terrain-debris');
 const pile=p.sides.A.special;
 if(first!==0)[pile.hand[0],pile.hand[first]]=[pile.hand[first],pile.hand[0]];
 const second=pile.hand.findIndex(c=>c.type==='terrain-plasma');
 if(second<0){
  const at=pile.deck.findIndex(c=>c.type==='terrain-plasma');
  assert.ok(at>=0);
  [pile.hand[1],pile.deck[at]]=[pile.deck[at],pile.hand[1]];
 }else if(second!==1){
  [pile.hand[1],pile.hand[second]]=[pile.hand[second],pile.hand[1]];
 }
 assert.equal(pile.hand[0].type,'terrain-debris');
 assert.equal(pile.hand[1].type,'terrain-plasma');
 assert.equal(validateTacticalOrder(p,'A',{specialIndices:[0,1],numericIndices:[]}).reason,
  'terrain_conflict');
});
test('PvP: Terreno cambia davvero danno, consuma carta autentica e poi scade',()=>{
 const x=createTacticalDuel({mode:'pvp',shipA:'N00',shipB:'N00',
  specialDeckA:makeDeck('terrain-debris')});
 const i=makeVisible(x,'A','terrain-debris');
 const reference=createTacticalDuel({mode:'pvp',shipA:'N00',shipB:'N00'});
 const noTerrain=commit(reference);
 const withTerrain=commit(x,{specialIndices:[i]});
 assert.equal(withTerrain.activeTerrain.id,'terrain-debris');
 assert.equal(withTerrain.activeTerrain.untilRound,2);
 assert.ok(withTerrain.sides.A.defense.shield.hp>=noTerrain.sides.A.defense.shield.hp);
 assert.ok(withTerrain.sides.B.defense.shield.hp>=noTerrain.sides.B.defense.shield.hp);
 assert.equal(withTerrain.sides.A.special.hand.length+withTerrain.sides.A.special.deck.length+
  withTerrain.sides.A.special.discard.length,24);
 assert.ok(withTerrain.sides.A.special.discard.some(c=>c.type==='terrain-debris'));
 const round2=advanceTacticalDuel(withTerrain,8101);
 assert.equal(round2.round,2);
 assert.equal(pvpTerrainAtRound(round2.activeTerrain,2).id,'terrain-debris');
 const played=commit(round2);
 const round3=advanceTacticalDuel(played,8101);
 assert.equal(round3.round,3);
 assert.equal(pvpTerrainAtRound(round3.activeTerrain,3),null);
});
test('Due Terreni opposti, stessa fase: nessuna priorità del primo ordine confermato',()=>{
 const b=createTacticalDuel({mode:'pvp',
  specialDeckA:makeDeck('terrain-debris'),specialDeckB:makeDeck('terrain-plasma')});
 const a=makeVisible(b,'A','terrain-debris'),z=makeVisible(b,'B','terrain-plasma');
 const out=commit(b,{specialIndices:[a]},{specialIndices:[z]});
 assert.equal(out.activeTerrain,null);
 assert.ok(out.lastEvents.some(s=>s.includes('annullati')));
 assert.ok(out.sides.A.special.discard.some(c=>c.type==='terrain-debris'));
 assert.ok(out.sides.B.special.discard.some(c=>c.type==='terrain-plasma'));
});


test('I quattro Terreni renderizzano i PNG HD ufficiali in tutte le viste, senza varianti finte',async()=>{
 const {readFileSync}=await import('node:fs');
 const portrait=readFileSync(new URL('./PvpTerrainPortrait.jsx',import.meta.url),'utf8');
 const live=readFileSync(new URL('./OfficialLiveBattle3D.jsx',import.meta.url),'utf8');
 const deck=readFileSync(new URL('./SpecialDeckPanel.jsx',import.meta.url),'utf8');
 for(const terrain of Object.values(PVP_TERRAIN_CATALOG)){
  assert.match(terrain.imagePath,/\.png$/);
  const bytes=readFileSync(new URL('../public'+terrain.imagePath,import.meta.url));
  assert.equal(bytes.readUInt32BE(16),512,terrain.id);
  assert.equal(bytes.readUInt32BE(20),768,terrain.id);
 }
 assert.ok(portrait.includes('src={terrain.imagePath}'));
 assert.ok(!portrait.includes("terrain.id+'.svg'"));
 assert.ok(live.includes("backgroundImage:'url('+terrain.imagePath+')'"));
 assert.ok(live.includes("'--live-terrain-art':'url('+terrain.imagePath+')'"));
 assert.ok(live.includes('<PvpTerrainPortrait type={card.type}/>'));
 // Nel gestore mazzo il fronte viene mostrato tramite lo stesso catalogo PNG.
 assert.ok(deck.includes('officialSpecialArtPath(type)'));
});
