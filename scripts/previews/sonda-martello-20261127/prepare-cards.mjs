import fs from 'node:fs';
import path from 'node:path';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {cardWords,textFields} from './card-text.mjs';
export const PROBE='weapon-designed-ionic-sonda-ionica',HAMMER='weapon-designed-ionic-martello-tuono';
export function previewCards(root=path.resolve('.')){
 const slug={Comune:'comune',Rara:'rara',Epica:'epica',Leggendaria:'leggendaria'},english={Comune:'common',Rara:'rare',Epica:'epic',Leggendaria:'legendary'};
 const cards=WEAPON_NEAR_FINAL_VALUES.filter(c=>[PROBE,HAMMER].includes(c.weaponFamilyId||c.id)).map(c=>{const p=c.effectSpec.weaponProfile,kind=c.id.startsWith(PROBE)?'probe':'hammer';
  const row={id:c.id,familyId:c.weaponFamilyId||c.id,kind,rarity:c.rarita,raritySlug:slug[c.rarita],duration:p.durationTurns,damage:p.baseDamage,bonus:p.comboBonusDamage||0,elementId:'ionic',artPath:path.join(root,'asset-sources/weapon-previews/sonda-martello-2026-11-27/art',kind+'-'+english[c.rarita]+'.png'),reviewOnly:true,inGame:false};
  row.name=cardWords(row).name;row.effect=cardWords(row).description;for(const lang of ['en','it'])textFields(row,lang);return row;});
 if(cards.length!==7||cards.some(c=>!fs.existsSync(c.artPath)||c.duration!==1))throw Error('Catalogo o illustrazioni non completi');
 return cards;
}
if(process.argv[2]){const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify({status:'anteprime complete in attesa di approvazione grafica',direction:'B',directionApproved:true,cardVisualApproval:false,inGame:false,defaultLocale:'en',canvas:[3072,4608],cards:previewCards()},null,2)+'\n');console.log('Sette schede EN/IT preparate dai nominali correnti.');}
