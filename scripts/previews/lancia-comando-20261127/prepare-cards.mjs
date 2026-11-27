import fs from 'node:fs';
import path from 'node:path';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {COMMAND_LANCE_FAMILY} from '../../../src/commandLanceSpec.js';
import {cardWords,textFields} from '../../../src/commandLanceCardText.js';
export function previewCards(root=path.resolve('.')){
 const slug={Rara:'rara',Epica:'epica',Leggendaria:'leggendaria'},english={Rara:'rare',Epica:'epic',Leggendaria:'legendary'};
 const cards=WEAPON_NEAR_FINAL_VALUES.filter(c=>(c.weaponFamilyId||c.id)===COMMAND_LANCE_FAMILY).map(c=>{
  const p=c.effectSpec.weaponProfile,row={id:c.id,familyId:COMMAND_LANCE_FAMILY,kind:'lance',rarity:c.rarita,raritySlug:slug[c.rarita],duration:p.durationTurns,damage:p.baseDamage,bonus:p.characterBonusDamage,elementId:'ionic',artPath:path.join(root,'asset-sources/weapon-previews/lancia-comando-2026-11-27/art/lance-'+english[c.rarita]+'.png'),reviewOnly:false,inGame:true};
  row.name=cardWords(row).name;row.effect=cardWords(row).description;for(const lang of ['en','it'])textFields(row,lang);return row;
 });
 if(cards.length!==3||cards.some(c=>!fs.existsSync(c.artPath)||c.duration!==1))throw Error('Missing source or catalog variant');
 return cards;
}
if(process.argv[2]){
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify({status:'TRE FRONTI APPROVATI IL 27/11/2026',directionApproved:true,cardVisualApproval:true,inGame:true,defaultLocale:'en',canvas:[3072,4608],cards:previewCards()},null,2)+'\n');
}
