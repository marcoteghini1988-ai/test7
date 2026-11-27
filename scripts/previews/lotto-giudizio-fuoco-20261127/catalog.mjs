import fs from 'node:fs';
import path from 'node:path';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {card} from '../../../src/fleetNext/rules.js';
import {CARD_TEXT_REGIONS} from '../../../src/cardTextAssets.js';
import directions from './directions.json' with {type:'json'};
export const FAMILIES=Object.freeze({
 'weapon-designed-ionic-giudizio-temporale':'judgment',
 'weapon-designed-plasma-mortaio-magmatico':'mortar',
 'weapon-designed-plasma-inceneritore-rotante':'incinerator'
});
export function previewCards(root=path.resolve('.')){
 const slug={Rara:'rara',Epica:'epica',Leggendaria:'leggendaria'};
 const cards=WEAPON_NEAR_FINAL_VALUES.filter(c=>FAMILIES[c.weaponFamilyId||c.id]).map(c=>{
  const familyId=c.weaponFamilyId||c.id,kind=FAMILIES[familyId],p=c.effectSpec.weaponProfile,live=card(c.id).effectSpec.weaponProfile;
  // Direct hits go through arsenalBonus; tickProvisionalBurns uses its locked
  // burn.damage directly. Keep the actually executed burn fields, not the
  // strategic print candidate's second, unused multiplier for those fields.
  const burn=kind==='incinerator'?Object.fromEntries(['burnTurns','burnPerDiscard','burnMinimum','burnMaxDamage'].map(k=>[k,live[k]])):null;
  return {id:c.id,familyId,kind,rarity:c.rarita,raritySlug:slug[c.rarita],elementId:c.elementId,
   duration:c.effectSpec.durationTurns,damage:p.baseDamage||0,extra:p.extraDamage||0,second:p.secondDamage||0,percent:p.damagePercent||0,burn,
   maxExtraShots:p.maxExtraShots||0,ammoMode:p.ammoMode||null,
   directionApproved:directions[kind].approved,frontApproved:directions.frontsApproved,inGame:directions.inGame,
   artPath:path.join(root,'asset-sources/weapon-previews/lotto-giudizio-fuoco-2026-11-27/art',kind+'-'+slug[c.rarita]+'.png'),
   catalogProfile:p,executedLegacyProfile:live,
   numericSource:kind==='incinerator'?'Strategic direct-hit values; locked burn fields from the executable burn path.':'WEAPON_NEAR_FINAL_VALUES',
   slug:(kind==='judgment'?'giudizio-temporale':kind==='mortar'?'mortaio-magmatico':'inceneritore-plasma')+'-'+slug[c.rarita]};
 });
 const order=['judgment','mortar','incinerator'];cards.sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)||['Rara','Epica','Leggendaria'].indexOf(a.rarity)-['Rara','Epica','Leggendaria'].indexOf(b.rarity));
 if(cards.length!==6||cards.filter(c=>c.kind==='mortar').length!==3||cards.filter(c=>c.kind==='incinerator').length!==2)throw Error('Batch must contain the six real catalog variants');
 return cards;
}
if(process.argv[2]){
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify({status:directions.frontsApproved?'APPROVED_AND_PROMOTED':'REVIEW_ONLY',defaultLocale:'en',canvas:[3072,4608],textRegions:CARD_TEXT_REGIONS,frontsApproved:directions.frontsApproved,inGame:directions.inGame,directions,cards:previewCards()},null,2)+'\n');
}
