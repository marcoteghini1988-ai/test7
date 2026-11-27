import fs from 'node:fs';
import path from 'node:path';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {card} from '../../../src/fleetNext/rules.js';
import {STORM_CAPACITOR_FAMILY} from '../../../src/stormCapacitorSpec.js';
import {cardWords,textFields} from '../../../src/stormCapacitorCardText.js';
export function previewCards(root=path.resolve('.')){
 const slug={Epica:'epica',Leggendaria:'leggendaria'},english={Epica:'epic',Leggendaria:'legendary'};
 const cards=WEAPON_NEAR_FINAL_VALUES.filter(c=>(c.weaponFamilyId||c.id)===STORM_CAPACITOR_FAMILY).map(c=>{
  const p=c.effectSpec.weaponProfile,row={id:c.id,familyId:STORM_CAPACITOR_FAMILY,kind:'storm',rarity:c.rarita,raritySlug:slug[c.rarita],duration:p.durationTurns,damage:p.baseDamage,bonus:p.perSupportDamage,energyCost:p.energyCost,elementId:'ionic',artPath:path.join(root,'asset-sources/weapon-previews/condensatore-tempesta-2026-11-27/art/storm-'+english[c.rarita]+'.png'),reviewOnly:true,inGame:false,catalogProfile:p,legacyGameplayProfile:card(c.id).effectSpec.weaponProfile};
  row.name=cardWords(row).name;row.effect=cardWords(row).description;for(const l of ['en','it'])textFields(row,l);return row;
 });
 if(cards.length!==2||cards.some(c=>!fs.existsSync(c.artPath)||c.duration!==3||c.energyCost!==1))throw Error('Missing source or catalog variant');
 return cards;
}
if(process.argv[2]){
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify({status:'FRONTI DA APPROVARE',directionApproved:true,cardVisualApproval:false,inGame:false,defaultLocale:'en',canvas:[3072,4608],numericSource:'WEAPON_NEAR_FINAL_VALUES',cards:previewCards()},null,2)+'\n');
}
