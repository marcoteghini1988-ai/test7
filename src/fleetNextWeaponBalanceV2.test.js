// Eclissi Stellare — audit di bilanciamento delle 73 Carte Arma ufficiali.
// Non confondere le Armi con le Carte Attacco: le Armi infliggono HP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_BASE_WEAPONS,CONFIRMED_WEAPON_CARDS,MULTI_WEAPON_CARDS,
 DESIGNED_WEAPON_CARDS,CONFIRMED_TRANSFER_WEAPONS,DISCARD_WEAPON,
 TEMP_SUPPORT_WEAPONS,card,cardRole} from './fleetNext/rules.js';
import {NEXT_NEW_WEAPON_CARDS} from './fleetNext/nextDeckLoadout.js';
import {PROVISIONAL_ADVANCED_WEAPONS} from './fleetNext/provisionalWeaponProfiles.js';

const ALL=Object.freeze([...NEXT_NEW_WEAPON_CARDS,DISCARD_WEAPON,...TEMP_SUPPORT_WEAPONS]);
const byId=id=>{const c=ALL.find(x=>x.id===id);assert.ok(c,id);return c;};
const spec=id=>byId(id).effectSpec;
const profile=id=>spec(id).weaponProfile;
const nominal=id=>spec(id).baseDamage;

test('73 armi uniche, tutte giocabili, con rarità, durata e slot propri',()=>{
 assert.equal(APPROVED_BASE_WEAPONS.length,22);
 assert.equal(CONFIRMED_WEAPON_CARDS.length,5);
 assert.equal(MULTI_WEAPON_CARDS.length,5);
 assert.equal(DESIGNED_WEAPON_CARDS.length,35);
 assert.equal(CONFIRMED_TRANSFER_WEAPONS.length,2);
 assert.equal(TEMP_SUPPORT_WEAPONS.length,3);
 assert.equal(NEXT_NEW_WEAPON_CARDS.length,69);
 assert.equal(ALL.length,73);
 assert.equal(new Set(ALL.map(c=>c.id)).size,73);
 for(const c of ALL){
  assert.equal(card(c.id),c,c.id);
  assert.equal(cardRole(c.id),'support',c.id);
  assert.equal(c.kind,'support',c.id);
  assert.equal(c.playable,true,c.id);
  assert.equal(c.effectSpec.type,'deployMachine',c.id);
  assert.equal(c.effectSpec.hp,1,c.id);
  assert.ok(Number.isInteger(c.effectSpec.durationTurns)&&
   c.effectSpec.durationTurns>=1&&c.effectSpec.durationTurns<=5,c.id);
  assert.ok(['Comune','Rara','Epica','Leggendaria'].includes(c.rarita),c.id);
  assert.ok(c.maxCopiesPerDeck>=1,c.id);
 }
});

test('22 Armi base: potenza crescente fra Comune e Rara, senza effetti extra',()=>{
 const commons=APPROVED_BASE_WEAPONS.filter(c=>c.rarita==='Comune');
 const rares=APPROVED_BASE_WEAPONS.filter(c=>c.rarita==='Rara');
 assert.equal(commons.length,16);assert.equal(rares.length,6);
 for(const c of commons)
  assert.ok(c.effectSpec.baseDamage>=18&&c.effectSpec.baseDamage<=31,c.id);
 for(const c of rares)
  assert.ok(c.effectSpec.baseDamage>=33&&c.effectSpec.baseDamage<=38,c.id);
 assert.ok(Math.max(...commons.map(c=>c.effectSpec.baseDamage))<
  Math.min(...rares.map(c=>c.effectSpec.baseDamage)));
});

test('Armi Ghiaccio: coppia combinabile comparabile a due Armi indipendenti',()=>{
 const [balestra,dardiera]=CONFIRMED_WEAPON_CARDS;
 assert.equal(balestra.effectSpec.baseDamage,18);
 assert.equal(dardiera.effectSpec.baseDamage,24);
 assert.equal(balestra.effectSpec.comboBonus,16);
 assert.equal(dardiera.effectSpec.comboBonus,16);
 assert.equal(balestra.effectSpec.baseDamage+dardiera.effectSpec.baseDamage+
  dardiera.effectSpec.comboBonus,58);
});

test('Raffiche, area e durata: potenza proporzionata a bersagli e risorse',()=>{
 const [single,double,repeat,sweep,energy]=MULTI_WEAPON_CARDS;
 assert.equal(single.effectSpec.baseDamage,26);
 assert.equal(double.effectSpec.baseDamage*double.effectSpec.shotCount,36);
 assert.equal(repeat.effectSpec.baseDamage*repeat.effectSpec.durationTurns,36);
 assert.equal(sweep.effectSpec.baseDamage*3,36);
 assert.equal(energy.effectSpec.baseDamage+energy.effectSpec.extraDamage*
  energy.effectSpec.maxExtraShots,48);
 assert.equal(profile('weapon-designed-plasma-batteria-tre-ugelli').baseDamage*3,42);
 assert.equal(profile('weapon-designed-plasma-lanciafiamme-ventaglio').baseDamage*3,33);
 assert.equal(profile('weapon-designed-cryogenic-batteria-dardi-polari').baseDamage*3,30);
 assert.equal(profile('weapon-designed-refrigerant-idrocannone-doppia-mandata').baseDamage*2,42);
 assert.equal(Math.round(profile('weapon-designed-plasma-torretta-piroclastica').baseDamage*
  (1+profile('weapon-designed-plasma-torretta-piroclastica').bonusPercent/100)),41);
});

test('Meccaniche avanzate: limiti delle penalità e combo preservate',()=>{
 assert.equal(PROVISIONAL_ADVANCED_WEAPONS.length,21);
 assert.equal(profile('weapon-designed-cryogenic-acceleratore-boreale').baseDamage+
  profile('weapon-designed-cryogenic-acceleratore-boreale').secondDamage,36);
 const incinerator=profile('weapon-designed-plasma-inceneritore-rotante');
 assert.equal(incinerator.burnTurns,5);
 assert.equal(incinerator.burnMaxDamage,12);
 assert.ok(incinerator.burnMaxDamage>=incinerator.burnMinimum);
 assert.deepEqual(profile('weapon-transferred-aerial-cicloreattore').freezeSeconds,[2,3,4]);
 assert.equal(profile('weapon-designed-refrigerant-alta-marea').comboMultiplier,4);
 assert.equal(profile('weapon-designed-refrigerant-alta-marea').maxDamage,120);
 assert.equal(profile('weapon-designed-metallic-perforatore-cascata').durationTurns,3);
 assert.equal(profile('weapon-designed-plasma-sistema-binario').durationTurns,5);
 assert.equal(profile('weapon-designed-plasma-sistema-binario').motherCostPercent,6);
 assert.equal(profile('weapon-designed-plasma-sistema-binario').allyCostPercent,4);
});

test('Cannone dei Frammenti: cresce con gli scarti ma non elimina istantaneamente una madre',()=>{
 const s=DISCARD_WEAPON.effectSpec;
 assert.equal(s.baseDamage,10);
 assert.equal(s.perDiscardAttack,10);
 assert.equal(s.energyMultiplier,2);
 assert.equal(s.maxNominalDamage,120);
 const nominalFor=(discardCount,hasFire)=>
  Math.min(s.maxNominalDamage,(s.baseDamage+
   discardCount*s.perDiscardAttack)*(hasFire?s.energyMultiplier:1));
 assert.equal(nominalFor(0,false),10);
 assert.equal(nominalFor(5,true),120);
 assert.equal(nominalFor(30,true),120);
});
