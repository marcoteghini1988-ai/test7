import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const helper='scripts/previews/20261126/collect-engine-events.mjs',loader='./scripts/previews/20261126/candidate-loader.mjs';
const read=args=>{const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
const original=read([helper]),candidate=read(['--import',loader,helper]);
test('HP ed Energie invariati; unica correzione meccanica è conservare la Difesa superata',()=>{
 assert.equal(candidate.length,original.length);for(let i=0;i<candidate.length;i++){
  const c=candidate[i],old=original[i];assert.equal(c.key,old.key);
  if(c.kind==='induction'&&c.mode==='shield-1'){
   for(const who of ['A','B'])for(const field of ['motherHp','escorts','energy','charges'])assert.deepEqual(c.state[who][field],old.state[who][field],c.key+':'+field);
   assert.deepEqual(c.state.B.defenses,c.before.B.defenses);assert.deepEqual(c.state.B.discard,c.before.B.discard);
  }else assert.deepEqual(c.state,old.state,c.key);
 }
});
test('ogni munizione ripartisce soltanto il danno totale realmente risolto',()=>{
 for(const c of candidate){assert.equal(c.projectiles.reduce((s,p)=>s+p.damage,0),c.aggregate.reduce((s,e)=>s+e.damage,0),c.key);}
});
test('Maglio 2/3/5/7 e Slitta una palla in tutte le rarità',()=>{
 const h=candidate.filter(c=>c.kind==='gravity-maul');assert.deepEqual(h.map(c=>c.projectiles.length),[2,3,5,7]);
 for(const c of candidate.filter(c=>c.kind==='steel-rail'))assert.equal(c.projectiles.length,1);
});
test('Termobalistica 3/6 dipende dal bonus reale in entrambe le rarità',()=>{
 for(const c of candidate.filter(c=>c.kind==='thermal-reclaimer'))assert.equal(c.projectiles.length,c.mode==='boost'?6:3,c.key);
});
test('superare una Difesa la conserva, smontarla la scarta, le Energie conteggiate restano',()=>{
 for(const c of candidate.filter(c=>c.kind==='induction'&&c.mode.startsWith('shield-'))){
  assert.deepEqual(c.state.A.energy,c.before.A.energy,c.key);const n=Number(c.mode.at(-1));assert.equal(c.state.B.defenses.length,c.before.B.defenses.length-(n===1?0:1),c.key);
  if(n!==1)assert.ok(c.state.B.discard.includes('gen-227'),c.key);
  if(n===0)assert.equal(c.projectiles.reduce((n,p)=>n+p.damage,0),0,c.key);
 }
});
test('le origini iniziali restano fuori dal bordo corretto e variano su tutta la larghezza',()=>{
 const origins=candidate.flatMap(c=>c.projectiles.map(p=>p.origin).filter(Boolean));assert.ok(new Set(origins.map(p=>p.x)).size>20);
 for(const p of origins){assert.equal(p.y,812);assert.ok(p.x>=26&&p.x<=424);}
});
test('il trasferimento a cascata usa le cariche effettive e non avviene a costo zero',()=>{
 for(const c of candidate.filter(c=>c.kind==='cascade-piercer'&&c.mode==='cascade')){assert.equal(c.before.A.energy.length,2);assert.equal(c.state.A.energy.length,0);assert.equal(c.state.B.escorts.filter(e=>e.destroyed).length,2);}
 for(const c of candidate.filter(c=>c.kind==='cascade-piercer'&&c.mode==='base'))assert.equal(new Set(c.projectiles.map(p=>p.targetId)).size,1);
});
