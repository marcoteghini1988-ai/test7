import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recoverOfficialCampaignCredits,LIVE_CREDIT_REGEN_MS as T}
 from './officialCampaignCreditRegen.js';

test('Crediti: 1 ogni 3 minuti, nessuna anticipazione del tick',()=>{
 const before=recoverOfficialCampaignCredits({credits:12,lastMs:1000,nowMs:1000+T-1});
 assert.equal(before.credits,12);
 assert.equal(before.recovered,0);
 assert.equal(before.remainingMs,1);
 const exact=recoverOfficialCampaignCredits({credits:12,lastMs:1000,nowMs:1000+T});
 assert.equal(exact.credits,13);
 assert.equal(exact.recovered,1);
 assert.equal(exact.remainingMs,T);
 assert.equal(exact.lastMs,1000+T);
});

test('Crediti: a rientro offline accredita i tick interi senza duplicati',()=>{
 const now=10*T+3;
 const fresh=recoverOfficialCampaignCredits({credits:20,lastMs:3,nowMs:now});
 assert.equal(fresh.credits,30);
 assert.equal(fresh.recovered,10);
 const repeat=recoverOfficialCampaignCredits({credits:fresh.credits,lastMs:fresh.lastMs,nowMs:now});
 assert.equal(repeat.recovered,0);
 assert.equal(repeat.credits,30);
 const next=recoverOfficialCampaignCredits({credits:repeat.credits,lastMs:repeat.lastMs,nowMs:now+T});
 assert.equal(next.credits,31);
 assert.equal(next.recovered,1);
});

test('Crediti: cap 200 senza accumulo occulto, bonus oltre cap conservati',()=>{
 const r=recoverOfficialCampaignCredits({credits:198,lastMs:0,nowMs:10*T});
 assert.deepEqual({credits:r.credits,recovered:r.recovered,full:r.full,lastMs:r.lastMs},
  {credits:200,recovered:2,full:true,lastMs:10*T});
 assert.equal(recoverOfficialCampaignCredits({credits:200,lastMs:0,nowMs:100*T}).credits,200);
 assert.equal(recoverOfficialCampaignCredits({credits:245,lastMs:0,nowMs:100*T}).credits,245);
 const afterSpend=recoverOfficialCampaignCredits({credits:180,lastMs:r.lastMs,nowMs:10*T+T-1});
 assert.equal(afterSpend.recovered,0);
});

test('Crediti: orologio tornato indietro non crea debito temporale o bonus',()=>{
 const t=recoverOfficialCampaignCredits({credits:10,lastMs:900000,nowMs:500000});
 assert.equal(t.credits,10);
 assert.equal(t.recovered,0);
 assert.equal(t.lastMs,500000);
 assert.equal(t.remainingMs,T);
});

test('Crediti: storage non numerico o negativo non avvelena React con NaN',()=>{
 for(const invalid of [NaN,Infinity,-5,1.5,null,undefined]){
  // null/undefined sono accettati come valori invalidi, mai 0 gratuito.
  const t=recoverOfficialCampaignCredits({credits:invalid,lastMs:0,nowMs:2*T,maxCredits:200});
  assert.equal(t.credits,200,String(invalid));
  assert.equal(t.full,true);
 }
 for(const lastMs of [NaN,Infinity,-100,4000000]){
  const t=recoverOfficialCampaignCredits({credits:20,lastMs,nowMs:10000});
  assert.equal(t.credits,20);
  assert.equal(t.lastMs,10000);
  assert.equal(t.recovered,0);
 }
});

test('App: credito iniziale e timer HUD usano il calcolo puro condiviso',()=>{
 const src=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 assert.match(src,/import \{recoverOfficialCampaignCredits\}/);
 const hits=src.match(/recoverOfficialCampaignCredits\(\{/g)||[];
 assert.equal(hits.length,2,'inizializzazione e ricarica HUD devono condividere la logica');
 assert.match(src,/setCredits\(prev=>prev>=maxCredits\?prev:/);
 assert.match(src,/eclissi_last_credit_time/);
});
