import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {card,cardFacePath} from './fleetNext/rules.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {OFFICIAL_WEAPON_FRONT_BY_ID} from './fleetNext/officialWeaponArt.js';

const APPROVED=[
 ['Comune','weapon-confirmed-metallic-maglio',18,'c090a26ae0bdf0bb49413b7b5ef0b05094fb5ce9'],
 ['Rara','weapon-confirmed-metallic-maglio-rarity-r',46,'3f7659ef724b0f215a34c66e912c63390b060d53'],
 ['Epica','weapon-confirmed-metallic-maglio-rarity-e',109,'c5547fc0731544acf33df14575438dbefc454d9a'],
 ['Leggendaria','weapon-confirmed-metallic-maglio-rarity-l',154,'aed990c63ec79e2e3723508dc17f16790ced38a1']
];

test('Maglio Ferrogravitazionale: quattro fronti originali montati, uno per rarità',()=>{
 assert.equal(Object.keys(OFFICIAL_WEAPON_FRONT_BY_ID).length,4);
 for(const [rarita,id,damage,expectedBlob] of APPROVED){
  const definition=card(id);
  assert.ok(definition,id);
  assert.equal(definition.rarita,rarita,id);
  assert.equal(WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec?.baseDamage,damage,id);
  assert.equal(WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec?.durationTurns,1,id);
  const art=cardFacePath(id);
  assert.equal(art,OFFICIAL_WEAPON_FRONT_BY_ID[id],id);
  assert.equal(art,'/assets/fleet-weapon-fronts/'+id+'.webp');
  const file=resolve(process.cwd(),'public'+art);
  assert.ok(existsSync(file),'File ufficiale mancante: '+file);
  const data=readFileSync(file);
  assert.ok(data.length>100000,'Immagine troppo piccola: '+id);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  const hash=createHash('sha1').update(Buffer.from('blob '+data.length+'\\0'.replace('\\0','\0')))
   .update(data).digest('hex');
  assert.equal(hash,expectedBlob,'Il file non è la versione approvata: '+id);
 }
});
test('Le altre Carte Arma non cambiano immagine o meccaniche',()=>{
 for(const id of ['weapon-confirmed-metallic-slitta','weapon-confirmed-plasma-nucleo',
                   'weapon-base-ionic-01']){
  assert.ok(card(id),id);
  assert.equal(officialWeaponFacePathForTest(id),null,id);
  assert.equal(cardFacePath(id),null,id);
 }
});
function officialWeaponFacePathForTest(id){return OFFICIAL_WEAPON_FRONT_BY_ID[id]||null;}
