import test from 'node:test';
import assert from 'node:assert/strict';
import {probeHammerSequence} from '../scripts/previews/sonda-martello-20261127/sequence.mjs';
const shots=(r,kind)=>r.frames.filter(f=>f.kind===kind).map(f=>f.event);
for(const rarity of ['Comune','Rara','Epica','Leggendaria'])test('Sonda '+rarity+': un impatto e segnale solo sul vero bersaglio',()=>{
 const r=probeHammerSequence({rarity,mode:'probe-only'}),e=shots(r,'probe')[0],mark=r.battle.sides.A.provisionalWeaponStatus.ionProbe;
 assert.equal(e.hitCount,1);assert.ok(e.actualDamage>0);assert.equal(mark.id,e.impacts[0].targetId);
});
for(const rarity of ['Rara','Epica','Leggendaria'])test('Martello '+rarity+': autonomo, combo nello stesso turno o nel successivo',()=>{
 assert.equal(shots(probeHammerSequence({rarity,mode:'hammer-alone'}),'hammer')[0].hitCount,1);
 for(const mode of ['combo','next-turn']){const r=probeHammerSequence({rarity,mode}),e=shots(r,'hammer')[0];assert.equal(e.hitCount,2);assert.equal(e.impacts[0].targetId,e.impacts[1].targetId);assert.equal(r.battle.sides.A.provisionalWeaponStatus.ionProbe,null);}
});
test('La Sonda bloccata non attiva la combo; una Difesa intercetta separatamente i due impatti',()=>{
 const p=probeHammerSequence({mode:'probe-blocked'});assert.equal(shots(p,'probe')[0].actualDamage,0);assert.equal(shots(p,'hammer')[0].hitCount,1);
 const h=shots(probeHammerSequence({mode:'hammer-blocked'}),'hammer')[0];assert.equal(h.hitCount,2);assert.ok(h.impacts.every(i=>i.defenseBlocked&&i.actualDamage===0));
});
test('Ordine inverso e segnale scaduto mantengono un solo colpo del Martello',()=>{
 for(const mode of ['reverse','expired'])assert.equal(shots(probeHammerSequence({mode}),'hammer')[0].hitCount,1);
});
test('Bersaglio ucciso dalla Sonda: il Martello conserva il tiro normale su un bersaglio vivo',()=>{
 const r=probeHammerSequence({mode:'target-dies',supports:true}),p=shots(r,'probe')[0],h=shots(r,'hammer')[0];
 assert.equal(p.impacts[0].destroyed,true);assert.equal(h.hitCount,1);assert.notEqual(h.impacts[0].targetId,p.impacts[0].targetId);assert.ok(h.actualDamage>0);
});
test('Supporto ucciso dal primo fendente: niente secondo colpo o trasferimento inventato',()=>{
 const r=probeHammerSequence({mode:'first-hit-kills',supports:true}),h=shots(r,'hammer')[0];assert.equal(h.hitCount,1);assert.equal(h.impacts[0].destroyed,true);
});
test('Il segnale sul Generatore della madre viene seguito anche con un nuovo ordine su Arsenale',()=>{
 const r=probeHammerSequence({mode:'next-turn',targetPart:'generator',hammerTargetPart:'weapons'}),h=shots(r,'hammer')[0];assert.equal(h.hitCount,2);assert.ok(h.impacts.every(i=>i.targetId==='generator'));
});
test('La stessa combo funziona dal lato B',()=>{const r=probeHammerSequence({who:'B',supports:true});assert.equal(shots(r,'hammer')[0].hitCount,2);assert.equal(r.battle.sides.B.provisionalWeaponStatus.ionProbe,null);});
