import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {card,ENERGY_CARDS} from './fleetNext/rules.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {LOCALIZED_WEAPON_CARD_IDS,cardTextFields,cardTextSvgContents,cardTextBasePath,localizedCardText} from './cardTextPresentation.js';
import {getCardTextLocale,setCardTextLocale,subscribeCardTextLocale} from './cardTextLocale.js';
import {stormCapacitorVariant} from './stormCapacitorSpec.js';
import {CORE_FAMILY} from './coreThunderSpec.js';
import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};

test('English is the default for every core text, including name, full effect and rarity',()=>{
 setCardTextLocale('en');assert.equal(getCardTextLocale(),'en');
 for(const id of LOCALIZED_WEAPON_CARD_IDS.filter(id=>id.startsWith(CORE_FAMILY))){
  const fields=cardTextFields(id),text=localizedCardText(card(id));
  assert.deepEqual(fields.slice(0,2).map(f=>f.text),['GROWING THUNDER','CORE CANNON']);
  assert.equal(text.name,'Growing Thunder Core Cannon');assert.match(text.description,/play a new Lightning Energy card/);
  assert.equal(fields[2].text,'WEAPON');assert.equal(fields[5].text,'LIGHTNING');
  assert.equal(fields[10].text,WEAPON_NEAR_FINAL_BY_ID[id].effectSpec.weaponProfile.damageStages.join(' / '));
 }
});
test('Locale switching preserves artwork paths and the exact real card/charge/damage definitions',()=>{
 const snapshot=JSON.stringify(LOCALIZED_WEAPON_CARD_IDS.map(card));let called=0;
 const unsubscribe=subscribeCardTextLocale(()=>called++);
 const paths=LOCALIZED_WEAPON_CARD_IDS.map(cardTextBasePath);
 setCardTextLocale('it');assert.equal(called,1);assert.equal(cardTextFields(LOCALIZED_WEAPON_CARD_IDS[0])[0].text,'CANNONE A NUCLEO');
 setCardTextLocale('it');assert.equal(called,1);
 assert.deepEqual(LOCALIZED_WEAPON_CARD_IDS.map(cardTextBasePath),paths);
 assert.equal(JSON.stringify(LOCALIZED_WEAPON_CARD_IDS.map(card)),snapshot);
 setCardTextLocale('unsupported');assert.equal(getCardTextLocale(),'en');assert.equal(called,2);unsubscribe();
});
test('Both languages fit the fixed text sectors with actual font advances and have isolated SVG material IDs',()=>{
 assert.equal(createHash('sha256').update(readFileSync('docs/riferimenti-carte/font/EclissiVettore-Regular.ttf')).digest('hex'),metrics.fontSha256);
 for(const id of LOCALIZED_WEAPON_CARD_IDS)for(const lang of ['en','it']){
  for(const f of cardTextFields(id,lang)){
   assert.ok([...f.text].every(c=>Object.hasOwn(metrics.advances,c)),'Glyph missing: '+f.text);
   const width=[...f.text].reduce((n,c)=>n+(metrics.advances[c]??metrics.advances.M),0)/metrics.unitsPerEm*f.size+
    (f.text.length-1)*(f.spacing??(f.weight==='minor'?4:1))+(f.stroke??(f.weight==='number'?12:f.weight==='strong'?9:7))*2;
   assert.ok(width<=f.maxWidth+.1,id+':'+lang+':'+f.text);
  }
  const a=cardTextSvgContents(id,lang,'first'),b=cardTextSvgContents(id,lang,'second');
  assert.match(a,/id="card-text-first-material"/);assert.match(b,/id="card-text-second-material"/);
  assert.equal((a.match(/<text /g)||[]).length,stormCapacitorVariant(id)?18:17);assert.doesNotMatch(a,/<image|<script/);
 }
});
test('Migration backgrounds are verified RGBA HD assets and original approved card bytes remain intact',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../asset-sources/card-text/nucleo-folgore/manifest.json',import.meta.url)));
 assert.equal(manifest.artworkRegenerated,false);assert.equal(manifest.cards.length,3);
 for(const c of manifest.cards){
  const bytes=readFileSync(c.path),original=readFileSync('public/assets/fleet-weapon-fronts/'+c.id+'.png');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),c.sha256);assert.equal(bytes.length,c.bytes);
  assert.equal(bytes.readUInt32BE(16),3072);assert.equal(bytes.readUInt32BE(20),4608);assert.equal(bytes[25],6);
  assert.equal(createHash('sha256').update(original).digest('hex'),c.originalFrontSha256);
 }
});
test('Native Energy card names and full effects share the locale without changing their charge count',()=>{
 for(const c of ENERGY_CARDS){
  const text=localizedCardText(c,'en');assert.match(text.name,/Energy$/);assert.match(text.description,new RegExp('Adds '+c.effectSpec.charges+' '));
  assert.doesNotMatch(text.name,/void|gravity|Energia/);assert.match(localizedCardText(c,'it').name,/^Energia /);
 }
});
