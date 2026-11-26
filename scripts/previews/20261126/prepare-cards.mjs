import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {FAMILIES,RARITIES,SLUGS,SOURCE_COMMIT,OPEN_PARAMETERS} from './review-spec.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const out=path.resolve(process.argv[2]),inputs=JSON.parse(fs.readFileSync(path.join(out,'art-inputs.json')));
const old=Object.fromEntries([1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(path.join(root,`docs/riferimenti-carte/metallo-lotto-${i}-2026-11-25/manifest.json`))).cards).map(c=>[c.id,c]));
const titles={pettine:['IONIC COMB','OF VEGA'],tesla:['TESLA SPIRAL','DART LAUNCHER'],sferzatore:['LUNAR COPPER','IONIC WHIP'],lampo:['WHITE FLASH','CANNON'],'ganascia-a':['MAGNETIC JAW','A'],'ganascia-b':['MAGNETIC JAW','B'],maglio:['FERROGRAVITATIONAL','MAUL']};
const cards=[];
for(const f of FAMILIES)for(const c of WEAPON_NEAR_FINAL_VALUES.filter(c=>(c.weaponFamilyId||c.id)===f.id)){
 const tier=RARITIES.indexOf(c.rarita),slug=SLUGS[tier],w=c.effectSpec.weaponProfile||{},art=inputs[f.key+'-'+slug];
 const source=old[c.id]||{};
 const item={id:c.id,familyId:f.id,name:f.name,kind:f.kind,rarity:c.rarita,raritySlug:slug,rarityLabel:['COMMON','RARE','EPIC','LEGENDARY'][tier],
  titleLines:titles[f.key]||source.titleLines,duration:c.effectSpec.durationTurns||w.durationTurns||1,damage:c.effectSpec.baseDamage??w.baseDamage,
  elementId:f.id.includes('ionic')?'ionic':'metallic',elementText:f.id.includes('ionic')?'LIGHTNING':'METAL',elementIcon:f.id.includes('ionic')?'fulmine':'metallo',
  existingFront:!art,artPath:art||path.join(root,'public/assets/fleet-weapon-fronts',c.id+'.png'),
  panel:{targets:'1 TARGET',action:f.counts[tier]+' SHOT'+(f.counts[tier]===1?'':'S')},reviewOnly:true,mechanicsPending:false};
 if(f.key==='termobalistica')Object.assign(item,{recoveryPercent:w.damageConversionPercent,maxBonus:w.maxExtraDamage,panel:{targets:'1 TARGET',action:'3 / 6 SHOTS'}});
 if(f.key==='induzione')item.panel={targets:'1 TARGET',action:f.counts[tier]+' BLADES',rightLabel:'METAL ENERGY',rightLines:['BYPASS / REMOVE'],rightValueSize:78};
 if(f.key==='cascata')item.panel={targets:'RELAY',action:'EXCESS HP',rightLabel:'PAID TRANSFER',rightLines:['1 METAL / RELAY'],rightValueSize:82};
 if(f.key==='schegge')item.panel={targets:'1 / TURN',action:f.counts[tier]+' SHARDS'};
 if(f.key==='pettine')item.panel.action='1 DISCHARGE';
 if(f.key==='tesla')item.panel.action='1 DART';
 if(f.key==='sferzatore')item.panel.action='1 WHIP';
 if(f.key==='lampo')item.panel.action='1 FLASH';
 if(f.key==='ganascia-a')Object.assign(item,{duration:3,mechanicsPending:true,panel:{damageLabel:'T1 / T2 DAMAGE',targets:'1 TARGET',action:'1 JAW',rightLabel:'T3 FINAL TEAR',rightLines:['DAMAGE TBD'],rightValueSize:87}});
 if(f.key==='ganascia-b')Object.assign(item,{duration:null,damage:null,mechanicsPending:true,panel:{damageLabel:'DAMAGE TBD',targets:'1 TARGET',action:'1 JAW',rightLabel:'WITH JAW A',rightLines:['FLEET / FLOOR','COLLISION'],rightValueSize:76}});
 if(!item.titleLines)throw Error('Titolo mancante '+c.id);
 cards.push(item);
}
const manifest={status:'anteprime complete in attesa di approvazione grafica',sourceCommit:SOURCE_COMMIT,canvas:[3072,4608],inGame:false,openParameters:OPEN_PARAMETERS,cards};
fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify(manifest,null,2));
let composer=fs.readFileSync(path.join(root,'scripts/compose-weapon-fronts.cjs'),'utf8');
composer=composer.replace("${text(1158,3355,102,'METAL','strong')}","${text(1158,3355,c.elementId==='ionic'?80:102,c.elementText,'strong')}");
composer=composer.replace("c.duration,'number'","c.duration??'TBD','number'").replace("c.duration===1?'TURN':'TURNS'","c.duration==null?'':c.duration===1?'TURN':'TURNS'");
composer=composer.replace("c.damage+' HP'","c.damage==null?'TBD':c.damage+' HP'");
composer=composer.replace("const element=await sharp(path.join(stickers,'elementi/metallo.png')).resize(300,300).toBuffer();",'');
composer=composer.replace("const statElement=await sharp(path.join(stickers,'elementi/metallo.png')).resize(170,170).toBuffer();",'');
composer=composer.replace("const center=slots[c.raritySlug],type=labels(c),art=await scene(c);",`const center=slots[c.raritySlug];let type=labels(c);const art=await scene(c);
  if(c.duration==null)type=Buffer.from(type.toString().replace(/<g transform="translate\\(1752 3352\\)">[\\s\\S]*?<\\/g>/,''));`);
composer=composer.replace("const file=path.resolve(batchRoot,c.artPath);",`const file=path.resolve(batchRoot,c.artPath);
 if(c.existingFront)return sharp(file).composite([{input:path.join(batchRoot,'maschere',c.raritySlug+'.png'),blend:'dest-in'}]).png().toBuffer();`);
composer=composer.replace('compressionLevel:9,adaptiveFiltering:true','compressionLevel:3,adaptiveFiltering:false');
fs.writeFileSync(path.join(out,'compose-review.cjs'),composer);
console.log(JSON.stringify({cards:cards.length,newIllustrations:cards.filter(c=>!c.existingFront).length,mechanicsPending:cards.filter(c=>c.mechanicsPending).length}));
