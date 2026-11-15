import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {describeEffect} from './fleetNext/simpleEffects.js';
import general from './fleetNext/catalogGeneral.json' with {type:'json'};
import exclusive from './fleetNext/catalogExclusive.json' with {type:'json'};
const byId=new Map([...general.carte,...exclusive.cards].map(x=>[x.id,x]));
const root=resolve('public/assets/fleet-approved-fronts');
test('Lotti approvati: fronti integrati fedeli al catalogo e agli asset WebP',()=>{
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 const requiredIds=[
  'gen-001','gen-032','gen-055','gen-067','gen-071','gen-094','gen-106','gen-116','gen-219','gen-245',
  'gen-072','gen-073','gen-074','gen-075','gen-076','gen-077','gen-078','gen-080','gen-081','gen-082',
  'gen-083','gen-084','gen-085','gen-086','gen-087','gen-088','gen-089','gen-090','gen-091','gen-092'
 ];
 const actualIds=new Set(manifest.cards.map(x=>x.id));
 assert.ok(manifest.cards.length>=requiredIds.length&&manifest.cards.length<=379,'Conteggio fronti fuori limite');
 assert.equal(actualIds.size,manifest.cards.length,'Fronti approvati duplicati');
 for(const id of requiredIds)assert.ok(actualIds.has(id),'Lotto 01-03 approvato mancante: '+id);
 for(const meta of manifest.cards){
  const c=byId.get(meta.id);
  assert.ok(c,'ID ufficiale mancante '+meta.id);
  assert.equal(meta.name,c.nome||c.name);
  assert.equal(meta.role,c.sottotipo||c.category);
  assert.equal(meta.rarity,c.rarita||c.rarityDraft);
  assert.equal(meta.effect,c.effetto||c.effectProposed);
  assert.equal(meta.effect,describeEffect(c));
  assert.ok(meta.originalApprovedEffect,'Testo approvato originale non conservato '+meta.id);
  assert.equal(meta.rulesRevision,'simple-effects-v1');
  assert.ok(meta.rulesPanel[1]>=950&&meta.rulesPanel[1]+meta.rulesPanel[3]<=1250,'Sovrapposizione fuori dal pannello effetto '+meta.id);
  const art=resolve(root,meta.id+'.webp');
  assert.ok(existsSync(art),'Sorgente frontale assente '+meta.id);
  const binary=readFileSync(art);
  assert.equal(binary.toString('ascii',0,4),'RIFF');
  assert.equal(binary.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(binary).digest('hex'),meta.originalApprovedAssetSha256,'WebP approvato modificato '+meta.id);
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',meta.id+'.svg'),'utf8');
  assert.ok(svg.includes('width="512" height="768"'));
  const start=svg.indexOf('data-approved-front="'+meta.id+'"');
  assert.ok(start>=0,'Fronte approvato non inserito '+meta.id);
  const embedded=svg.slice(start).match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(embedded,'WebP approvato assente '+meta.id);
  assert.ok(Buffer.from(embedded[1],'base64').equals(binary),'Arte approvata differente '+meta.id);
  const ruleStart=svg.indexOf('data-current-effect="'+meta.id+'"');
  assert.ok(ruleStart>svg.indexOf('/>',start),'Regole nuove coperte dal fronte originale '+meta.id);
  assert.ok(svg.slice(ruleStart).includes('clip-path="url(#rules-'+meta.id+'-g1-approved)"'),'Regole fuori dal solo pannello '+meta.id);
  assert.ok(!svg.includes('ECLISSI STELLARE'),'Marchio sulla carta '+meta.id);
 }
});
