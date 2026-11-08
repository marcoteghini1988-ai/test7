import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {BOSS_CHARACTER_TYPES,bossCharacterTypeForPlanet} from './bossCharacterCards.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {SPECIAL_COLLECTION_KEY,createSpecialCollection,normalizeSpecialCollection,
 readSpecialCollection,validateSpecialDeck,equipSpecialDeck,openSpecialPack,
 specialPackReward,SPECIAL_PACK_TYPES} from './specialDeckBuilder.js';
import {makeSpecialInstances} from './specialCards.js';
import {officialBattleSetup} from './officialBattleSetup.js';
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,
 setItem:(key,value)=>data.set(key,value),data};};
const victory=(planet,sector,mode='campaign')=>({winner:'player',mode,
 sectorNumber:sector,bossPlanetId:planet,bossSectorLevel:10});

test('Le 12 carte restano ZERO nello starter e non sono mai assegnate dai pacchetti casuali',()=>{
 const base=createSpecialCollection();
 assert.equal(BOSS_CHARACTER_TYPES.length,12);
 assert.equal(base.loadout.length,24);
 assert.equal(SPECIAL_PACK_TYPES.length,16); // 11 originali + Mutazione + Dado/Bomba/Malus/Dorata; Moduli/Boss/Terreni/Epici esclusi
 assert.ok(BOSS_CHARACTER_TYPES.every(id=>base.owned[id]===0));
 assert.ok(SPECIAL_PACK_TYPES.every(type=>!BOSS_CHARACTER_TYPES.includes(type)));
 for(const value of [0,.125,.5,.875,.999999]){
  const pack=openSpecialPack(specialPackReward(base,'random:'+value).collection,()=>value);
  assert.equal(pack.opened,true);
  assert.equal(pack.drawn.some(type=>BOSS_CHARACTER_TYPES.includes(type)),false);
 }
});

test('Vincere un boss assegna la SUA sola Carta Personaggio, senza inserimento automatico nel mazzo',()=>{
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const s=storage();
  const before=createSpecialCollection();
  const first=claimBossCharacterFromVictory(victory(planet.id,(i+1)*10),s);
  assert.equal(first.granted,true,planet.name);
  const id=bossCharacterTypeForPlanet(planet.id);
  assert.equal(first.type,id);
  const current=readSpecialCollection(s);
  assert.equal(current.owned[id],1);
  assert.deepEqual(current.loadout,before.loadout,'Le 24 carte non vengono cambiate senza il giocatore');
  assert.equal(BOSS_CHARACTER_TYPES.filter(type=>current.owned[type]).length,1);
  assert.equal(current.claimedRewards.filter(key=>key==='boss:character:'+planet.id).length,1);
  assert.equal(current.packCredits,0,'Nessun pacchetto o costo inventato');
  const repeat=claimBossCharacterFromVictory(victory(planet.id,(i+1)*10),s);
  assert.equal(repeat.granted,false);
  assert.equal(readSpecialCollection(s).owned[id],1);
  const afterAdventure=claimBossCharacterFromVictory(victory(planet.id,(i+1)*10,'adventure'),s);
  assert.equal(afterAdventure.granted,false,'Non due carte fra campagna e avventura');
 }
});

test('Sconfitta, pareggio, settore normale, pianeta incoerente e PvP non scrivono alcun premio',()=>{
 const s=storage();
 const baseline=createSpecialCollection();
 s.setItem(SPECIAL_COLLECTION_KEY,JSON.stringify(baseline));
 const old=s.getItem(SPECIAL_COLLECTION_KEY);
 for(const input of [
  {...victory(1,10),winner:'enemy'}, {...victory(1,10),winner:'draw'},
  victory(1,9), victory(1,20),victory(1,10,'pvp'),
  {...victory(1,10),bossSectorLevel:9},
  {...victory(1,10),winner:null},
 ]){
  const answer=claimBossCharacterFromVictory(input,s);
  assert.equal(answer.granted,false,JSON.stringify(input));
  assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),old,'Non si devono modificare salvataggi su partite non valide');
 }
});

test('Salvataggi v1 vecchi migrano con possesso ZERO ma conservano livelli, pacchetti e mazzo',()=>{
 const base=createSpecialCollection();
 const legacy={...base,owned:{...base.owned},packCredits:7,openedPacks:4,
  claimedRewards:['campaign:sector:6']};
 for(const type of BOSS_CHARACTER_TYPES)delete legacy.owned[type];
 const s=storage();
 s.setItem(SPECIAL_COLLECTION_KEY,JSON.stringify(legacy));
 const before=s.getItem(SPECIAL_COLLECTION_KEY);
 const migrated=readSpecialCollection(s);
 assert.ok(BOSS_CHARACTER_TYPES.every(type=>migrated.owned[type]===0));
 assert.equal(migrated.packCredits,7);assert.equal(migrated.openedPacks,4);
 assert.deepEqual(migrated.claimedRewards,legacy.claimedRewards);
 assert.deepEqual(migrated.loadout,legacy.loadout);
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),before,'Solo la lettura non riscrive un salvataggio');
 assert.throws(()=>normalizeSpecialCollection({...legacy,owned:{...legacy.owned,
  'shot-ion':undefined}}),/Numero di carte/);
});

test('Solo un personaggio vinto può entrare nel mazzo da 24; non più di una copia',()=>{
 const base=createSpecialCollection(),id='boss-character-1';
 const chosen=base.loadout.map((type,i)=>i===0?id:type);
 assert.equal(validateSpecialDeck(base,chosen).reason,'not_owned');
 const s=storage();
 const awarded=claimBossCharacterFromVictory(victory(1,10),s).collection;
 assert.equal(validateSpecialDeck(awarded,chosen).valid,true);
 const equipped=equipSpecialDeck(awarded,chosen);
 assert.equal(equipped.loadout.length,24);
 assert.equal(equipped.loadout.filter(type=>type===id).length,1);
 assert.equal(makeSpecialInstances(equipped.loadout).filter(c=>c.type===id).length,1);
 const double=chosen.map((type,i)=>i===1?id:type);
 assert.equal(validateSpecialDeck({...awarded,owned:{...awarded.owned,[id]:9}},double).reason,'copy_limit');
 assert.throws(()=>makeSpecialInstances(double),/Troppe copie/);
});


test('Dalla vittoria boss al prossimo duello reale: mano 5 e personaggio solo se equipaggiato',()=>{
 const s=storage();
 const base=createSpecialCollection();
 const id='boss-character-1';
 const ownedShip={cards:[{instanceId:'owned:N00',shipId:'N00',level:3}],
  loadout:['owned:N00']};
 const getBattle=collection=>officialBattleSetup({mode:'campaign',sectorNumber:11,
  bossPlanetId:2,bossSectorLevel:1,shipCollection:ownedShip,
  specialCollection:collection,nowMs:150,seed:84}).battle;
 assert.throws(()=>getBattle({...base,loadout:[id,...base.loadout.slice(1)]}),
  /Mazzo speciale non valido/);
 const awarded=claimBossCharacterFromVictory(victory(1,10),s).collection;
 const stored=readSpecialCollection(s);
 assert.deepEqual(stored.loadout,base.loadout);
 const notEquipped=getBattle(stored);
 assert.equal([...notEquipped.sides.A.special.hand,
  ...notEquipped.sides.A.special.deck].some(c=>c.type===id),false);
 const equipped=equipSpecialDeck(awarded,[id,...awarded.loadout.slice(1)]);
 const fight=getBattle(equipped);
 const real=[...fight.sides.A.special.hand,...fight.sides.A.special.deck,
  ...fight.sides.A.special.discard];
 assert.equal(real.length,24);
 assert.equal(real.filter(c=>c.type===id).length,1);
 assert.equal(fight.sides.A.special.hand.length,5);
 assert.equal(fight.sides.A.numeric.hand.length,7);
 assert.equal(fight.sides.B.bossCharacter,null);
});
