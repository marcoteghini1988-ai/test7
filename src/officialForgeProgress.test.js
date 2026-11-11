import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeOfficialForgeQueue,isOfficialForgeJob,
 applyOfficialForgeCompletion,isOfficialForgeJobInQueue} from './officialForgeProgress.js';

const job=(type='ability',id='aries',targetLevel=2,finishTime=1000)=>({
 type,id,targetLevel,finishTime,etherRush:3,name:'Ariete'
});

test('Il Cantiere accetta i quattro tipi di lavoro autentici',()=>{
 for(const type of ['ability','deck','terrain','epic']){
  const task=job(type,'x',4,1700);
  assert.equal(isOfficialForgeJob(task),true,type);
  assert.equal(normalizeOfficialForgeQueue([task]).length,1,type);
  const inventory={x:{unlocked:true,level:3}};
  const completed=applyOfficialForgeCompletion(inventory,task);
  assert.equal(completed.x.level,4);
  assert.equal(completed.x.unlocked,true);
  assert.deepEqual(inventory,{x:{unlocked:true,level:3}},'non mutare inventario precedente');
 }
});

test('Una lavorazione scaduta non puo retrocedere un Modulo o un Epico',()=>{
 for(const type of ['ability','deck','terrain','epic']){
  const inventory={x:{unlocked:true,level:7,custom:'preservato'}};
  const out=applyOfficialForgeCompletion(inventory,job(type,'x',4));
  assert.strictEqual(out,inventory,'aggiornamento superfluo non deve riscrivere');
  assert.equal(out.x.level,7);
  const locked={x:{unlocked:false,level:7,custom:'preservato'}};
  const repair=applyOfficialForgeCompletion(locked,job(type,'x',4));
  assert.equal(repair.x.level,7);
  assert.equal(repair.x.unlocked,true);
  assert.equal(repair.x.custom,'preservato');
 }
});

test('Livelli del Cantiere non saltano e non producono inventari retroattivi',()=>{
 const j1=job('ability','aries',2);
 const j2=job('ability','aries',3,2000);
 let state={aries:{unlocked:true,level:1}};
 state=applyOfficialForgeCompletion(state,j2);
 assert.equal(state.aries.level,3);
 state=applyOfficialForgeCompletion(state,j1);
 assert.equal(state.aries.level,3);
 const unknown=applyOfficialForgeCompletion(state,job('terrain','other',1));
 assert.equal(unknown.other.unlocked,true);
 assert.equal(unknown.other.level,1);
});

test('Storage Cantiere: payload illegibili scartati senza contaminare i lavori veri',()=>{
 const good=job();
 const broken=[
  null,{},[],12,{'type':'ability',id:'x',targetLevel:2,finishTime:NaN},
  {...good,type:'unknown'}, {...good,id:''},
  {...good,targetLevel:0},{...good,targetLevel:10},{...good,targetLevel:1.5},
  {...good,finishTime:Infinity},{...good,finishTime:-1}
 ];
 assert.equal(normalizeOfficialForgeQueue('corrupt').length,0);
 assert.equal(normalizeOfficialForgeQueue({test:good}).length,0);
 assert.deepEqual(normalizeOfficialForgeQueue([good,...broken]),[good]);
 for(const invalid of broken){
  assert.equal(isOfficialForgeJob(invalid),false);
  assert.deepEqual(applyOfficialForgeCompletion({x:{level:8}},invalid),
   {x:{level:8}});
 }
});

test('Accelerazione: un pulsante obsoleto non trova il job gia riscosso',()=>{
 const old=job('epic','epic_item_1',2,4500),other=job('ability','aries',3,6300);
 const queue=[old,other];
 assert.equal(isOfficialForgeJobInQueue(queue,old),true);
 assert.equal(isOfficialForgeJobInQueue(queue,other),true);
 const after=queue.filter(q=>q!==old);
 assert.equal(isOfficialForgeJobInQueue(after,old),false);
 assert.equal(isOfficialForgeJobInQueue(after,other),true);
 assert.equal(isOfficialForgeJobInQueue(queue,{...old,finishTime:4501}),false);
 assert.equal(isOfficialForgeJobInQueue(queue,{...old,targetLevel:3}),false);
 assert.equal(isOfficialForgeJobInQueue(queue,{...old,type:'deck'}),false);
});

test('App: il Cantiere blocca prima del costo Etere e applica livelli monotoni',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.match(app,/normalizeOfficialForgeQueue\(/);
 assert.match(app,/finishOfficialForgeJob=useCallback/);
 assert.match(app,/applyOfficialForgeCompletion\(prev,item\)/);
 assert.match(app,/isOfficialForgeJobInQueue\(forgeQueueRef\.current,item\)/);
 assert.match(app,/forgeQueueRef\.current=forgeQueueRef\.current\.filter/);
 assert.match(app,/forgeEtherRef\.current-=cost/);
 assert.match(app,/if\(!finished\)\{/);
});
