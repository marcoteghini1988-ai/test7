import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {liveNumericBossShieldFactor,liveNumericBossRememberShield,
 liveNumericBossNativeBonus,liveNumericBossAfterShot,liveNumericBossAfterVital,
 liveNumericBossSyncBonus,liveNumericBossRepairAmount,
 liveNumericBossEscortCooperation,liveNumericBossRememberEscortCooperation}
 from './officialLiveNumericBossPassives.js';
const game=(id,level=9,shipA='N00')=>
 createTacticalDuel({shipA,shipB:'N00',levelA:1,levelB:1,
  bossNumericDeckA:{id,level},nowMs:0});
test('Mazzo Gaia conserva gli HP autentici iniziali sulla barriera, non crea carte',()=>{
 const b=game('planet_char_1',3);
 assert.equal(b.sides.A.defense.shield.max,64); // 60 + floor(60*8%)
 assert.equal(b.sides.A.defense.shield.hp,64);
});
test('Anelli di Crono difende soltanto il primo pacchetto efficace',()=>{
 const b=game('planet_char_6',3),a=b.sides.A;
 assert.equal(liveNumericBossShieldFactor(a),.84);
 liveNumericBossRememberShield(a,0);
 assert.equal(liveNumericBossShieldFactor(a),.84);
 liveNumericBossRememberShield(a,10);
 assert.equal(liveNumericBossShieldFactor(a),1);
});
test('Ombre: bonus fuoco nativo solo sotto il 35% della propria barriera',()=>{
 const b=game('planet_char_9',6),a=b.sides.A;
 assert.equal(liveNumericBossNativeBonus(a,50,'W01',null,1).damage,50);
 a.defense.shield.hp=20;
 const result=liveNumericBossNativeBonus(a,50,'W01',null,1);
 assert.equal(result.damage,55);
 liveNumericBossAfterShot(a,10,'W01',result.bonus,1);
 assert.equal(a.bossNumericDeck.outgoingBonusRemainder,50);
});
test('Magma numerico: bonus al terzo colpo reale e carta Corrosione realmente attiva',()=>{
 const b=game('planet_char_19',9),a=b.sides.A;
 const no=liveNumericBossNativeBonus(a,50,'W01',null,1);
 assert.equal(no.damage,50);
 liveNumericBossAfterShot(a,0,'W01',no.bonus,1);
 assert.equal(a.bossNumericDeck.magmaShieldHits,0);
 a.bossNumericDeck.magmaShieldHits=2;
 const bonus=liveNumericBossNativeBonus(a,50,'W01',{corrosion:true},1);
 assert.equal(bonus.damage,59);
 liveNumericBossAfterShot(a,8,'W01',bonus.bonus,1);
 assert.equal(a.bossNumericDeck.magmaShieldHits,3);
});
test('Risonanza: bonus soltanto quando cambia il vero focus arma',()=>{
 const b=game('planet_char_17',9,'C03'),a=b.sides.A;
 a.bossNumericDeck.lastFocusedWeaponId='W04';
 const same=liveNumericBossNativeBonus(a,50,'W04',null,1);
 assert.equal(same.damage,50);
 const changed=liveNumericBossNativeBonus(a,50,'W05',null,1);
 assert.equal(changed.damage,54);
 liveNumericBossAfterShot(a,8,'W05',changed.bonus,1);
 assert.equal(a.bossNumericDeck.lastFocusedWeaponId,'W05');
});
test('Sovrano numerico: supremazia si attiva DOPO vitale KO, non nel ciclo del KO',()=>{
 const b=game('planet_char_20',9),a=b.sides.A;
 liveNumericBossAfterVital(a,10,true,1);
 assert.equal(a.bossNumericDeck.supremacyArmedAfterRound,1);
 assert.equal(liveNumericBossNativeBonus(a,50,'W01',null,1).damage,50);
 const next=liveNumericBossNativeBonus(a,50,'W01',null,2);
 assert.equal(next.damage,54);
 liveNumericBossAfterShot(a,8,'W01',next.bonus,2);
 assert.equal(a.bossNumericDeck.supremacyArmedAfterRound,0);
});
test('Generatore ottiene Sincronia bonus da punti autentici e Afrodite migliora riparazione',()=>{
 const generator=game('planet_char_14',6).sides.A;
 assert.equal(liveNumericBossSyncBonus(generator,20),6);
 assert.equal(liveNumericBossSyncBonus(generator,0),0);
 const afrodite=game('planet_char_3',6).sides.A;
 assert.equal(liveNumericBossRepairAmount(afrodite,20),22);
 assert.equal(liveNumericBossRepairAmount(afrodite,0),0);
});

test('Sinfonia di flotta Risonanza: +7% solo dopo impatto efficace della madre e scudiera vera',()=>{
 const a=game('planet_char_17',9).sides.A;
 assert.equal(liveNumericBossEscortCooperation(a,50,1).damage,50);
 a.liveMotherHitRound=1;
 const first=liveNumericBossEscortCooperation(a,50,1);
 assert.equal(first.damage,53);
 assert.equal(first.bonus.remainder,50);
 liveNumericBossRememberEscortCooperation(a,0,first.bonus);
 assert.equal(a.bossNumericDeck.resonanceEscortRemainder,0,'colpo senza HP non accumula remainder');
 liveNumericBossRememberEscortCooperation(a,4,first.bonus);
 assert.equal(a.bossNumericDeck.resonanceEscortRemainder,50);
 const second=liveNumericBossEscortCooperation(a,50,1);
 assert.equal(second.damage,54);
 assert.equal(second.bonus.remainder,0);
 assert.equal(liveNumericBossEscortCooperation(a,50,2).damage,50,
  'la madre del ciclo precedente non vale nel ciclo successivo');
 const low=game('planet_char_17',6).sides.A;
 low.liveMotherHitRound=1;
 assert.equal(liveNumericBossEscortCooperation(low,50,1).damage,50,
  'Sinfonia non esiste prima di livello 7');
});
