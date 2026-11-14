import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import general from './fleetNext/catalogGeneral.json' with {type:'json'};
import exclusive from './fleetNext/catalogExclusive.json' with {type:'json'};
const byId=new Map([...general.carte,...exclusive.cards].map(x=>[x.id,x]));
const root=resolve('public/assets/fleet-approved-fronts');
test('Lotti 01 e 02: venti fronti approvati identici ai sorgenti e fedeli al catalogo',()=>{
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 assert.equal(manifest.cards.length,20);
 assert.equal(new Set(manifest.cards.map(x=>x.id)).size,20);
 for(const meta of manifest.cards){
  const c=byId.get(meta.id);
  assert.ok(c,'ID ufficiale mancante '+meta.id);
  assert.equal(meta.name,c.nome||c.name);
  assert.equal(meta.role,c.sottotipo||c.category);
  assert.equal(meta.rarity,c.rarita||c.rarityDraft);
  assert.equal(meta.effect,c.effetto||c.effectProposed);
  const art=resolve(root,meta.id+'.webp');
  assert.ok(existsSync(art),'Sorgente frontale assente '+meta.id);
  const binary=readFileSync(art);
  assert.equal(binary.toString('ascii',0,4),'RIFF');
  assert.equal(binary.toString('ascii',8,12),'WEBP');
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',meta.id+'.svg'),'utf8');
  assert.ok(svg.includes('width="512" height="768"'));
  const start=svg.indexOf('data-approved-front="'+meta.id+'"');
  assert.ok(start>=0,'Fronte approvato non inserito '+meta.id);
  const embedded=svg.slice(start).match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(embedded,'WebP approvato assente '+meta.id);
  assert.ok(Buffer.from(embedded[1],'base64').equals(binary),'Arte approvata differente '+meta.id);
  assert.ok(!svg.includes('ECLISSI STELLARE'),'Marchio sulla carta '+meta.id);
 }
});
