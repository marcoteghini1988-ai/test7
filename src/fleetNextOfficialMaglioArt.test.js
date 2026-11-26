import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {card,cardFacePath} from './fleetNext/rules.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {OFFICIAL_WEAPON_FRONT_BY_ID} from './fleetNext/officialWeaponArt.js';

const CURRENT=[
 ['Comune','weapon-confirmed-metallic-maglio',18,'5e5d3d80a11ed8e791c9a4c969379b8829e6fb10'],
 ['Rara','weapon-confirmed-metallic-maglio-rarity-r',46,'d8d849d2b3130b9ed0c58d08e2d16b1056be4616'],
 ['Epica','weapon-confirmed-metallic-maglio-rarity-e',109,'2100bcf562b5f770e9fe3fd6442a25948d35baa6'],
 ['Leggendaria','weapon-confirmed-metallic-maglio-rarity-l',154,'242c7dbe3cb58a0682d7f54682d4e8a75c1e29bc']
];

test('Maglio Ferrogravitazionale: quattro fronti HD montati, uno per rarità',()=>{
 assert.equal(Object.keys(OFFICIAL_WEAPON_FRONT_BY_ID).length,40);
 for(const [rarita,id,damage,expectedBlob] of CURRENT){
  const definition=card(id);
  assert.ok(definition,id);
  assert.equal(definition.rarita,rarita,id);
  assert.equal(WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec?.baseDamage,damage,id);
  assert.equal(WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec?.durationTurns,1,id);
  const art=cardFacePath(id);
  assert.equal(art,OFFICIAL_WEAPON_FRONT_BY_ID[id],id);
  assert.equal(art,'/assets/fleet-weapon-fronts/'+id+'.png');
  const file=resolve(process.cwd(),'public'+art);
  assert.ok(existsSync(file),'File ufficiale mancante: '+file);
  const data=readFileSync(file);
  assert.ok(data.length>100000,'Immagine troppo piccola: '+id);
  assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(data.readUInt32BE(16),3072);
  assert.equal(data.readUInt32BE(20),4608);
  const hash=createHash('sha1').update(Buffer.from('blob '+data.length+'\\0'.replace('\\0','\0')))
   .update(data).digest('hex');
  assert.equal(hash,expectedBlob,'Il fronte è diverso dalla versione HD corrente: '+id);
 }
});
test('Le altre Carte Arma non cambiano immagine o meccaniche',()=>{
 for(const id of ['weapon-confirmed-plasma-nucleo',
                   'weapon-base-mineral-01']){
  assert.ok(card(id),id);
  assert.equal(officialWeaponFacePathForTest(id),null,id);
  assert.equal(cardFacePath(id),null,id);
 }
});
function officialWeaponFacePathForTest(id){return OFFICIAL_WEAPON_FRONT_BY_ID[id]||null;}
